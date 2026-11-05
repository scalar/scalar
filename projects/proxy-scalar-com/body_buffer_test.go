package main

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"runtime"
	"strings"
	"sync"
	"testing"
	"testing/iotest"
	"time"
)

func TestBufferedBodyLifetime(t *testing.T) {
	proxy := NewProxyServer(true)
	body, release, err := proxy.replayableBody(strings.NewReader("request body"))
	if err != nil {
		t.Fatal(err)
	}
	defer body.Close()
	defer release()

	// A redirect can still be uploading when the final response headers arrive.
	request, err := http.NewRequest(http.MethodPost, "http://upstream.example", body)
	if err != nil {
		t.Fatal(err)
	}
	configureBodyReplay(request, body)
	replay, err := request.GetBody()
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

func TestBufferingFailureReleasesBudget(t *testing.T) {
	for _, failure := range []error{context.Canceled, io.ErrUnexpectedEOF} {
		t.Run(failure.Error(), func(t *testing.T) {
			proxy := NewProxyServer(true)
			// The failure arrives after some upload bytes have already been reserved.
			input := io.MultiReader(strings.NewReader("partial upload"), iotest.ErrReader(failure))
			body, release, err := proxy.replayableBody(input)
			defer release()
			if body != nil {
				defer body.Close()
			}
			if !errors.Is(err, failure) {
				t.Fatalf("Expected %v, got %v", failure, err)
			}
			if got := proxy.bufferedBodyBytes.Load(); got != 0 {
				t.Fatalf("Failed upload retained %d buffered bytes", got)
			}
		})
	}
}

func TestTransportFailureReleasesBudget(t *testing.T) {
	proxy := NewProxyServer(true)
	defer proxy.transport.CloseIdleConnections()
	proxy.transport.DialContext = func(context.Context, string, string) (net.Conn, error) {
		return nil, errors.New("upstream unavailable")
	}
	req := httptest.NewRequest(http.MethodPost, "/?scalar_url=http://upstream.example", strings.NewReader("upload"))
	response := httptest.NewRecorder()
	proxy.handleRequest(response, req)
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("Expected 503, got %d", response.Code)
	}
	if got := proxy.bufferedBodyBytes.Load(); got != 0 {
		t.Fatalf("Transport failure retained %d buffered bytes", got)
	}
}

func TestEarlyResponseKeepsUploadCounted(t *testing.T) {
	proxy := NewProxyServer(true)
	defer proxy.transport.CloseIdleConnections()
	client, server := net.Pipe()
	defer client.Close()
	defer server.Close()
	proxy.transport.DialContext = func(context.Context, string, string) (net.Conn, error) { return client, nil }
	resumeUpload := make(chan struct{})
	resume := sync.OnceFunc(func() { close(resumeUpload) })
	defer resume()
	finishResponse := make(chan struct{})
	finish := sync.OnceFunc(func() { close(finishResponse) })
	defer finish()
	uploadResult := make(chan error, 1)
	const bodySize = 1 << 20
	serverDone := make(chan struct{})
	go func() {
		defer close(serverDone)
		request, err := http.ReadRequest(bufio.NewReader(server))
		if err != nil {
			uploadResult <- err
			return
		}
		defer request.Body.Close()
		// net.Pipe has no socket buffer: until this peer reads the body, the
		// upload cannot finish even though its response headers have arrived.
		_, err = io.WriteString(server, "HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nTransfer-Encoding: chunked\r\n\r\n")
		if err != nil {
			uploadResult <- err
			return
		}
		<-resumeUpload
		n, err := io.Copy(io.Discard, request.Body)
		if err == nil && n != bodySize {
			err = fmt.Errorf("expected %d upload bytes, got %d", bodySize, n)
		}
		uploadResult <- err
		<-finishResponse
		io.WriteString(server, "0\r\n\r\n")
	}()
	request := httptest.NewRequest(http.MethodPost, "/?scalar_url=http://upstream.example", io.LimitReader(zeroBodyReader{}, bodySize))
	response := &responseStartedWriter{header: make(http.Header), started: make(chan struct{})}
	done := make(chan struct{})
	t.Cleanup(func() {
		<-done
		<-serverDone
	})
	go func() { defer close(done); proxy.handleRequest(response, request) }()
	select {
	case <-response.started:
	case <-time.After(5 * time.Second):
		t.Fatal("Upstream response headers did not arrive")
	}
	if got := proxy.bufferedBodyBytes.Load(); got != bodySize {
		t.Fatalf("Early response released a still-active upload: got %d buffered bytes", got)
	}
	resume()
	select {
	case err := <-uploadResult:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("Upload did not complete")
	}
	finish()
	select {
	case <-done:
	case <-time.After(5 * time.Second):
		t.Fatal("Proxy did not finish the response")
	}
	if got := proxy.bufferedBodyBytes.Load(); got != 0 {
		t.Fatalf("Completed request retained %d buffered bytes", got)
	}
}

func TestReplayableBody(t *testing.T) {
	proxyServer := NewProxyServer(true)

	for _, status := range []int{http.StatusTemporaryRedirect, http.StatusPermanentRedirect} {
		t.Run(fmt.Sprintf("Follows a same-origin %d and resends the body", status), func(t *testing.T) {
			targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
				body, _ := io.ReadAll(r.Body)
				if r.URL.Path == "/items" {
					// Like FastAPI adding a trailing slash
					w.Header().Set("Location", "/items/")
					w.WriteHeader(status)
					return
				}
				fmt.Fprintf(w, "%s %s %s", r.Method, r.URL.Path, body)
			})
			defer targetServer.server.Close()

			req := httptest.NewRequest(http.MethodPost, "/?scalar_url="+url.QueryEscape(targetServer.url+"/items"), strings.NewReader(`{"name":"Mars"}`))
			w := httptest.NewRecorder()

			proxyServer.handleRequest(w, req)

			if w.Code != http.StatusOK {
				t.Fatalf("Expected status code %d, got %d: %s", http.StatusOK, w.Code, w.Body.String())
			}
			if got := w.Body.String(); got != `POST /items/ {"name":"Mars"}` {
				t.Errorf("Expected the body to be resent to /items/, got %q", got)
			}
		})
	}

	t.Run("Streams a body over the limit to the target unchanged", func(t *testing.T) {
		body := strings.Repeat("b", maxReplayableBodySize+10)
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			received, _ := io.ReadAll(r.Body)
			fmt.Fprintf(w, "%d", len(received))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodPut, "/?scalar_url="+url.QueryEscape(targetServer.url), strings.NewReader(body))
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if got := w.Body.String(); got != fmt.Sprint(len(body)) {
			t.Errorf("Expected the target to receive %d bytes, got %s", len(body), got)
		}
	})
}

func TestBufferedBodyLimit(t *testing.T) {
	t.Run("Does not replay a body over the limit when the last read also returns EOF", func(t *testing.T) {
		proxyServer := NewProxyServer(true)

		for _, tc := range []struct {
			size       int
			replayable bool
		}{{maxReplayableBodySize, true}, {maxReplayableBodySize + 1, false}} {
			body, release, err := proxyServer.replayableBody(iotest.DataErrReader(strings.NewReader(strings.Repeat("a", tc.size))))
			if err != nil {
				t.Fatalf("Expected no error, got %v", err)
			}
			defer release()
			defer body.Close()

			if _, ok := body.(*bufferedBodyReader); ok != tc.replayable {
				t.Errorf("%d bytes: expected replayable to be %v, got %v", tc.size, tc.replayable, ok)
			}

			received, _ := io.ReadAll(body)
			if len(received) != tc.size {
				t.Errorf("Expected %d bytes to be sent, got %d", tc.size, len(received))
			}
		}
	})

	t.Run("Stops buffering at the limit, however many bodies are held", func(t *testing.T) {
		proxyServer := NewProxyServer(true)
		releases := []func(){}
		replayable := 0

		// Each body stays held, like a client that stalls before finishing
		for i := 0; i < 100; i++ {
			body, release, err := proxyServer.replayableBody(strings.NewReader(strings.Repeat("a", maxReplayableBodySize)))
			if err != nil {
				t.Fatalf("Expected no error, got %v", err)
			}
			if _, ok := body.(*bufferedBodyReader); ok {
				replayable++
			}
			releases = append(releases, func() {
				body.Close()
				release()
			})
		}

		if held := proxyServer.bufferedBodyBytes.Load(); held > maxBufferedBodyBytes {
			t.Errorf("Expected at most %d buffered bytes, got %d", maxBufferedBodyBytes, held)
		}
		if replayable == 0 || replayable == 100 {
			t.Errorf("Expected only the bodies within the limit to be replayable, got %d of 100", replayable)
		}

		for _, release := range releases {
			release()
			release()
		}

		if held := proxyServer.bufferedBodyBytes.Load(); held != 0 {
			t.Errorf("Expected every buffered byte to be released, got %d", held)
		}
	})

	t.Run("Still delivers the whole body when the limit is reached", func(t *testing.T) {
		proxyServer := NewProxyServer(true)
		proxyServer.bufferedBodyBytes.Store(maxBufferedBodyBytes)

		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			received, _ := io.ReadAll(r.Body)
			fmt.Fprintf(w, "%s", received)
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodPost, "/?scalar_url="+url.QueryEscape(targetServer.url), strings.NewReader(`{"name":"Mars"}`))
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if got := w.Body.String(); got != `{"name":"Mars"}` {
			t.Errorf("Expected the target to receive the body, got %q", got)
		}
	})

	t.Run("Releases the body once the target has responded", func(t *testing.T) {
		proxyServer := NewProxyServer(true)

		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			io.ReadAll(r.Body)
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodPost, "/?scalar_url="+url.QueryEscape(targetServer.url), strings.NewReader("body"))
		proxyServer.handleRequest(httptest.NewRecorder(), req)

		if held := proxyServer.bufferedBodyBytes.Load(); held != 0 {
			t.Errorf("Expected every buffered byte to be released, got %d", held)
		}
	})
}
