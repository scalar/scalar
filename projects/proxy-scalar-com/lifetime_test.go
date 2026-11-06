package main

import (
	"context"
	"errors"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"
)

func TestProxyCancelsUpstream(t *testing.T) {
	for _, streaming := range []bool{false, true} {
		name := "waiting for headers"
		if streaming {
			name = "reading a stream"
		}
		t.Run(name, func(t *testing.T) {
			started, canceled, release := make(chan struct{}), make(chan struct{}), make(chan struct{})
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				io.Copy(io.Discard, r.Body)
				if streaming {
					w.Header().Set("Content-Type", "text/event-stream")
					io.WriteString(w, "data: hello\n\n")
					w.(http.Flusher).Flush()
				}
				close(started)
				select {
				case <-r.Context().Done():
					close(canceled)
				case <-release:
				}
			}))
			defer upstream.Close()
			defer close(release)
			proxy := NewProxyServer(true)
			defer proxy.transport.CloseIdleConnections()
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			request := httptest.NewRequest(http.MethodPost, "/", strings.NewReader("body to release")).WithContext(ctx)
			remote, _ := url.Parse(upstream.URL)
			done := make(chan error, 1)
			go func() { done <- proxy.executeProxyRequest(httptest.NewRecorder(), request, remote, upstream.URL) }()
			select {
			case <-started:
			case <-time.After(time.Second):
				t.Fatal("upstream request did not start")
			}
			cancel()
			select {
			case err := <-done:
				if err != nil {
					t.Errorf("got %v, want clean caller cancellation", err)
				}
			case <-time.After(time.Second):
				t.Fatal("proxy kept waiting after its caller canceled")
			}
			select {
			case <-canceled:
			case <-time.After(time.Second):
				t.Fatal("upstream did not observe cancellation")
			}
			if got := proxy.bufferedBodyBytes.Load(); got != 0 {
				t.Errorf("retained %d body bytes", got)
			}
		})
	}
}

func TestProxyResponseHeaderTimeout(t *testing.T) {
	proxy := NewProxyServer(true)
	defer proxy.transport.CloseIdleConnections()
	if proxy.transport.ResponseHeaderTimeout <= 0 {
		t.Fatal("upstream response headers have no timeout")
	}
	proxy.transport.ResponseHeaderTimeout = 20 * time.Millisecond
	release := make(chan struct{})
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		select {
		case <-r.Context().Done():
		case <-release:
		}
	}))
	defer upstream.Close()
	defer close(release)
	remote, _ := url.Parse(upstream.URL)
	done := make(chan error, 1)
	response := httptest.NewRecorder()
	go func() {
		done <- proxy.executeProxyRequest(response, httptest.NewRequest(http.MethodGet, "/", nil), remote, upstream.URL)
	}()
	select {
	case err := <-done:
		var timeoutError net.Error
		if !errors.As(err, &timeoutError) || !timeoutError.Timeout() {
			t.Fatalf("got %v, want timeout error", err)
		}
		if response.Code != http.StatusGatewayTimeout {
			t.Errorf("got status %d", response.Code)
		}
	case <-time.After(time.Second):
		t.Fatal("proxy kept waiting for response headers")
	}
}

func TestProxyResponseBodyIdleTimeout(t *testing.T) {
	for _, contentType := range []string{"text/plain", "text/event-stream"} {
		for _, active := range []bool{false, true} {
			name := contentType + "/stalled"
			if active {
				name = contentType + "/active"
			}
			t.Run(name, func(t *testing.T) {
				const idle = 200 * time.Millisecond
				proxy := NewProxyServerWithConfig(ProxyConfig{BypassCidr: true, ResponseBodyIdleTimeout: idle})
				defer proxy.transport.CloseIdleConnections()
				canceled := make(chan struct{})
				upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.Header().Set("Content-Type", contentType)
					io.WriteString(w, "first chunk\n")
					w.(http.Flusher).Flush()
					if active {
						// Keep producing data for longer than the idle budget in total.
						for range 8 {
							select {
							case <-time.After(idle / 4):
								io.WriteString(w, "next chunk\n")
								w.(http.Flusher).Flush()
							case <-r.Context().Done():
								return
							}
						}
						return
					}
					<-r.Context().Done()
					close(canceled)
				}))
				defer upstream.Close()
				server := httptest.NewServer(http.HandlerFunc(proxy.handleRequest))
				defer server.Close()
				client := &http.Client{Timeout: 3 * time.Second}
				response, err := client.Get(server.URL + "/?scalar_url=" + url.QueryEscape(upstream.URL))
				if err != nil {
					// An unflushed plain response can be aborted before its headers arrive.
					if active || contentType == "text/event-stream" {
						t.Fatal(err)
					}
				} else {
					defer response.Body.Close()
					body, readErr := io.ReadAll(response.Body)
					if active {
						if readErr != nil {
							t.Fatal(readErr)
						}
						if string(body) != "first chunk\n"+strings.Repeat("next chunk\n", 8) {
							t.Fatalf("incomplete active response: %q", body)
						}
					} else if readErr == nil {
						t.Fatalf("stalled response ended successfully: %q", body)
					}
				}
				if !active {
					select {
					case <-canceled:
					case <-time.After(time.Second):
						t.Fatal("upstream did not observe cancellation")
					}
				}
			})
		}
	}
}
