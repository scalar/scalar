package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"sync"
)

// Request-body ownership:
//   - replayableBody reserves bytes from the proxy-wide budget and returns an
//     upload reader plus a function that ends redirect-replay ownership.
//   - configureBodyReplay sets Content-Length and GetBody before the request is
//     sent. Each GetBody call creates another reader sharing the same buffer.
//   - net/http closes each upload reader. The caller also closes the initial
//     reader on exit to cover failures before the transport takes ownership.
//   - After client.Do returns, the caller releases replay ownership. Storage and
//     budget are released only when replay ownership and all upload readers end.
// This keeps early responses from undercounting active uploads and keeps long
// response streams from retaining completed request bodies.

// maxReplayableBodySize is how much of a request body the proxy buffers so Go
// can resend it when following a same-origin 307 or 308, like `curl -L`.
// Larger bodies are streamed, and such redirects are passed on unfollowed.
const maxReplayableBodySize = 10 << 20

// maxBufferedBodyBytes limits the memory all requests can hold in buffered bodies
// together. Without it, clients that send a body and then stall would each pin
// up to maxReplayableBodySize, without any authentication. Past the limit bodies
// are streamed instead of reserving more buffered bytes, losing 307 and 308
// replays. This budget counts payload bytes, not buffer capacity, transport
// allocations, or the headroom needed by the garbage collector.
const maxBufferedBodyBytes = 128 << 20

// bodyReadSize is how much of a request body is read and counted at a time.
const bodyReadSize = 32 << 10

// bufferedBody owns the replay copy and counts readers still used by the transport.
// A response can arrive before an upload finishes, so releasing replay ownership
// alone must not return those bytes to the budget.
type bufferedBody struct {
	mu           sync.Mutex
	data         []byte
	readers      int
	released     bool
	releaseBytes func()
}

func (b *bufferedBody) newReader() (io.ReadCloser, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.released {
		return nil, io.ErrClosedPipe
	}
	b.readers++
	return &bufferedBodyReader{buffer: b, reader: bytes.NewReader(b.data)}, nil
}

func (b *bufferedBody) release() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.released = true
	b.data = nil
	if b.readers == 0 {
		b.releaseBytes()
	}
}

// bufferedBodyReader clears its own reference on Close, even if net/http keeps
// the request reachable for the lifetime of a streaming response.
type bufferedBodyReader struct {
	mu     sync.Mutex
	buffer *bufferedBody
	reader *bytes.Reader
}

func (r *bufferedBodyReader) Read(p []byte) (int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.reader == nil {
		return 0, io.ErrClosedPipe
	}
	return r.reader.Read(p)
}

func (r *bufferedBodyReader) Close() error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.reader == nil {
		return nil
	}
	r.reader = nil
	r.buffer.mu.Lock()
	defer r.buffer.mu.Unlock()
	r.buffer.readers--
	if r.buffer.released && r.buffer.readers == 0 {
		r.buffer.releaseBytes()
	}
	return nil
}

// replayableBody buffers the request body when it is small enough and there is
// room. The returned function releases replay ownership; outstanding readers
// keep the bytes counted until closed. Both release and Close are idempotent.
func (ps *ProxyServer) replayableBody(body io.Reader) (io.ReadCloser, func(), error) {
	if body == nil {
		return nil, func() {}, nil
	}

	var held int64
	release := sync.OnceFunc(func() {
		ps.bufferedBodyBytes.Add(-held)
	})

	var buffered bytes.Buffer
	chunk := make([]byte, bodyReadSize)

	for buffered.Len() <= maxReplayableBodySize {
		// Count the chunk before reading it, so stalled reads count too
		if ps.bufferedBodyBytes.Add(bodyReadSize) > maxBufferedBodyBytes {
			ps.bufferedBodyBytes.Add(-bodyReadSize)
			break
		}

		// Reading one byte past the limit shows the body is too large
		n, err := body.Read(chunk[:min(bodyReadSize, maxReplayableBodySize+1-buffered.Len())])
		ps.bufferedBodyBytes.Add(int64(n - bodyReadSize))
		held += int64(n)
		buffered.Write(chunk[:n])

		if err == io.EOF && buffered.Len() <= maxReplayableBodySize {
			buffer := &bufferedBody{data: buffered.Bytes(), releaseBytes: release}
			reader, _ := buffer.newReader()
			return reader, buffer.release, nil
		}

		if err != nil && err != io.EOF {
			release()
			return nil, func() {}, fmt.Errorf("failed to read request body: %w", err)
		}
	}

	// Send what was read, then stream the rest. The wrapper hides the concrete
	// type, so http.NewRequest does not set GetBody.
	buffer := &bufferedBody{data: buffered.Bytes(), releaseBytes: release}
	reader, _ := buffer.newReader()
	return struct {
		io.Reader
		io.Closer
	}{io.MultiReader(reader, body), reader}, buffer.release, nil
}

// configureBodyReplay must run before the transport can read or close body.
func configureBodyReplay(request *http.Request, body io.ReadCloser) {
	// The closable reader drops its buffer when the transport finishes the upload.
	// Set replay metadata explicitly because NewRequest only recognizes bytes.Reader.
	if buffered, ok := body.(*bufferedBodyReader); ok {
		request.ContentLength = int64(buffered.reader.Len())
		request.GetBody = buffered.buffer.newReader
		if request.ContentLength == 0 {
			request.Body = http.NoBody
			buffered.Close()
		}
	}
}
