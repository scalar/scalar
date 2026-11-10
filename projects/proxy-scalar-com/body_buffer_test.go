package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"runtime"
	"strings"
	"sync"
	"testing"
)

func TestBufferedBodyLifetime(t *testing.T) {
	proxy := NewProxyServer(true)
	body, release := proxy.replayableBody(io.NopCloser(strings.NewReader("request body")), -1)
	if _, err := io.Copy(io.Discard, body); err != nil {
		t.Fatal(err)
	}
	defer body.Close()
	defer release()

	// A redirect can still be uploading when the final response headers arrive.
	replay, err := body.getBody()
	if err != nil {
		t.Fatal(err)
	}
	defer replay.Close()
	body.Close()
	release()
	release()
	if got := proxy.bufferedBodyBytes.Load(); got != int64(len("request body")) {
		t.Fatalf("Expected the outstanding upload to remain counted, got %d", got)
	}

	got, err := io.ReadAll(replay)
	if err != nil || string(got) != "request body" {
		t.Fatalf("Releasing replay ownership truncated the upload: %q, %v", got, err)
	}
	replay.Close()
	replay.Close()
	if got := proxy.bufferedBodyBytes.Load(); got != 0 {
		t.Fatalf("Expected no buffered bytes after the last upload closed, got %d", got)
	}
}

// Generate uploads without keeping a second payload allocation in the test.
type zeroBodyReader struct{}

func (zeroBodyReader) Read(p []byte) (int, error) {
	clear(p)
	return len(p), nil
}

type responseStartedWriter struct {
	header  http.Header
	started chan struct{}
	once    sync.Once
}

func (w *responseStartedWriter) Header() http.Header         { return w.header }
func (w *responseStartedWriter) WriteHeader(int)             {}
func (w *responseStartedWriter) Write(p []byte) (int, error) { return len(p), nil }
func (w *responseStartedWriter) Flush()                      { w.once.Do(func() { close(w.started) }) }

func TestStreamingResponsesReleaseRequestBuffers(t *testing.T) {
	finish := make(chan struct{})
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		io.Copy(io.Discard, r.Body)
		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)
		w.(http.Flusher).Flush()
		<-finish
	}))
	defer upstream.Close()
	proxy := NewProxyServer(true)
	var requests sync.WaitGroup
	defer func() {
		close(finish)
		requests.Wait()
		proxy.transport.CloseIdleConnections()
	}()

	runtime.GC()
	var before runtime.MemStats
	runtime.ReadMemStats(&before)
	for i := 0; i < 24; i++ {
		req := httptest.NewRequest(http.MethodPost, "/?scalar_url="+url.QueryEscape(upstream.URL), io.LimitReader(zeroBodyReader{}, 8<<20))
		writer := &responseStartedWriter{header: make(http.Header), started: make(chan struct{})}
		requests.Add(1)
		go func() {
			defer requests.Done()
			proxy.handleRequest(writer, req)
		}()
		<-writer.started
	}

	// Counter-only assertions miss retained Request.Body/GetBody references.
	// Keep 192 MiB of completed uploads' responses open and inspect the live heap.
	runtime.GC()
	var after runtime.MemStats
	runtime.ReadMemStats(&after)
	growth := int64(after.HeapAlloc) - int64(before.HeapAlloc)
	if growth > maxBufferedBodyBytes {
		t.Fatalf("Completed uploads still retain %d bytes with their response streams open (budget counter: %d)", growth, proxy.bufferedBodyBytes.Load())
	}
}
