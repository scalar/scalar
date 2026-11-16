package main

import (
	"bytes"
	"io"
	"net/http"
	"sync"
)

// Request-body ownership:
//   - replayableBody records bytes as the transport consumes the upload, without
//     waiting for EOF. Per-request and proxy-wide budgets bound the replay copy.
//   - configureBodyReplay sets Content-Length and GetBody before sending. A
//     completed replay gets its own reader sharing the buffered bytes.
//   - net/http closes upload readers. The initial streaming reader interrupts an
//     unfinished source read on Close; closing it in the handler could delay an
//     early response, so the transport owns that close.
//   - After client.Do returns, the caller releases replay ownership. Storage and
//     budget are released only when replay ownership and all replay readers end.
// This keeps early responses from undercounting active replay readers and keeps
// long response streams from retaining completed request bodies.

// maxReplayableBodySize is how much of a request body the proxy buffers so Go
// can resend it when following a same-origin 307 or 308, like `curl -L`.
// All bodies stream immediately; incomplete or larger uploads cannot be replayed.
const maxReplayableBodySize = 10 << 20

// maxBufferedBodyBytes limits the memory all requests can hold in buffered bodies
// together. Without it, clients that send a body and then stall would each pin
// up to maxReplayableBodySize, without any authentication. Past the limit bodies
// are streamed, which costs no memory and only loses 307 and 308 replays. The
// budget counts payload bytes, not buffer capacity, transport allocations, or
// the headroom needed by the garbage collector. At saturation, plan for about
// three times this budget in process memory because of GC headroom.
const maxBufferedBodyBytes = 128 << 20

// bufferedBody owns the replay copy and counts readers still used by the transport.
// A response can arrive before an upload finishes, so releasing replay ownership
// alone must not return those bytes to the budget.
type bufferedBody struct {
	mu           sync.Mutex
	data         []byte
	readers      int
	released     bool
	complete     bool
	releaseBytes func()
}

func (b *bufferedBody) release() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.releaseLocked()
}

func (b *bufferedBody) releaseLocked() {
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

// streamingReplayBody records bytes as they are consumed by the transport.
// Close must unblock Read, so the source is read outside the buffer mutex.
// Closing the initial upload keeps replay ownership until redirects finish.
type streamingReplayBody struct {
	source        io.ReadCloser
	buffer        *bufferedBody
	proxy         *ProxyServer
	length        int64
	held          int64
	consumed      int64
	finished      bool
	interruptRead func()
	closeOnce     sync.Once
	closeErr      error
}

func (r *streamingReplayBody) Read(p []byte) (int, error) {
	n, err := r.source.Read(p)
	r.buffer.mu.Lock()
	defer r.buffer.mu.Unlock()
	r.consumed += int64(n)
	r.finished = err != nil || (r.length > 0 && r.consumed == r.length)
	if r.buffer.released {
		return n, err
	}
	if (err != nil && err != io.EOF) || len(r.buffer.data)+n > maxReplayableBodySize {
		r.buffer.releaseLocked()
		return n, err
	}
	if r.proxy.bufferedBodyBytes.Add(int64(n)) > maxBufferedBodyBytes {
		r.proxy.bufferedBodyBytes.Add(-int64(n))
		r.buffer.releaseLocked()
		return n, err
	}
	r.held += int64(n)
	r.buffer.data = append(r.buffer.data, p[:n]...)
	// Known-length uploads may finish without a separate EOF read.
	r.buffer.complete = r.finished && (r.length <= 0 || r.consumed == r.length)
	return n, err
}

func (r *streamingReplayBody) Close() error {
	r.closeOnce.Do(func() {
		r.buffer.mu.Lock()
		finished := r.finished
		r.buffer.mu.Unlock()
		if !finished && r.interruptRead != nil {
			r.interruptRead()
		}
		r.closeErr = r.source.Close()
	})
	return r.closeErr
}

func (r *streamingReplayBody) getBody() (io.ReadCloser, error) {
	r.buffer.mu.Lock()
	defer r.buffer.mu.Unlock()
	if !r.buffer.complete || r.buffer.released {
		// net/http asks for the replay body before invoking CheckRedirect.
		// That callback recognizes this sentinel and returns the redirect as-is.
		return http.NoBody, nil
	}
	r.buffer.readers++
	return &bufferedBodyReader{buffer: r.buffer, reader: bytes.NewReader(r.buffer.data)}, nil
}

// replayableBody retains at most the per-request and shared budgets without
// reading ahead. The caller releases replay ownership after the redirect chain.
func (ps *ProxyServer) replayableBody(body io.ReadCloser, length int64) (*streamingReplayBody, func()) {
	if body == nil {
		body = http.NoBody
	}
	reader := &streamingReplayBody{source: body, proxy: ps, length: length}
	reader.buffer = &bufferedBody{releaseBytes: sync.OnceFunc(func() {
		ps.bufferedBodyBytes.Add(-reader.held)
	})}
	return reader, reader.buffer.release
}

// configureBodyReplay must run before the transport can read or close body.
func configureBodyReplay(request *http.Request, body *streamingReplayBody) {
	request.Body = body
	request.ContentLength = body.length
	request.GetBody = body.getBody
}
