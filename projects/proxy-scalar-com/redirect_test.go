package main

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"testing"
	"testing/iotest"
)

func TestRedirectOriginPolicy(t *testing.T) {
	tests := []struct {
		name         string
		destination  string
		intermediate bool
		allowed      bool
		body         bool
		loop         bool
	}{
		{name: "same-origin redirect loop", destination: "https://api.example/initial", loop: true},
		{name: "non-replayable credential body", destination: "https://other.example/final", body: true},
		{name: "unrelated hostname", destination: "https://other.example/final"},
		{name: "subdomain", destination: "https://sub.api.example/final"},
		{name: "scheme downgrade", destination: "http://api.example/final"},
		{name: "different port", destination: "https://api.example:8443/final"},
		{name: "cross-origin second hop", destination: "https://other.example/final", intermediate: true},
		{name: "same origin", destination: "https://api.example/final", allowed: true},
		{name: "explicit default port", destination: "https://api.example:443/final", allowed: true},
		{name: "case insensitive hostname", destination: "https://API.example/final", allowed: true},
		{name: "same-origin chain", destination: "https://api.example/final", intermediate: true, allowed: true},
	}
	for _, tc := range tests {
		for _, status := range []int{301, 302, 303, 307, 308} {
			t.Run(fmt.Sprintf("%s/%d", tc.name, status), func(t *testing.T) {
				var mu sync.Mutex
				var requests []*http.Request
				proxy := NewProxyServer(true)
				// Exercise net/http's real redirect header copying without DNS or network
				// access. Every attempted outbound request is recorded, even if its host
				// would otherwise resolve outside this test.
				dial := func(ctx context.Context, network, addr string) (net.Conn, error) {
					client, server := net.Pipe()
					go func() {
						defer server.Close()
						request, err := http.ReadRequest(bufio.NewReader(server))
						if err != nil {
							return
						}
						mu.Lock()
						requests = append(requests, request)
						mu.Unlock()
						if request.URL.Path == "/final" {
							fmt.Fprint(server, "HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nOK")
							return
						}
						destination := tc.destination
						if tc.intermediate && request.URL.Path == "/initial" {
							destination = "https://api.example/middle"
						}
						fmt.Fprintf(server, "HTTP/1.1 %d Redirect\r\nLocation: %s\r\nContent-Length: 0\r\nConnection: close\r\n\r\n", status, destination)
					}()
					return client, nil
				}
				proxy.transport = &http.Transport{DialContext: dial, DialTLSContext: dial}
				defer proxy.transport.CloseIdleConnections()
				target := "https://api.example/initial"
				remote, err := url.Parse(target)
				if err != nil {
					t.Fatal(err)
				}
				request := httptest.NewRequest(http.MethodGet, "/", nil)
				if tc.body {
					request = httptest.NewRequest(http.MethodPost, "/", strings.NewReader("secret=request-body"))
				}
				request.Header.Set("Authorization", "Bearer test-secret")
				request.Header.Set("Proxy-Authorization", "Basic test-secret")
				request.Header.Set("X-Scalar-Cookie", "session=test-secret")
				request.Header.Set("X-Api-Key", "test-secret")
				request.Header.Set("Arbitrary-Credential", "test-secret")
				response := httptest.NewRecorder()
				err = proxy.executeProxyRequest(response, request, remote, target)
				mu.Lock()
				defer mu.Unlock()
				expectedRequests := 1
				if tc.loop {
					expectedRequests = 10
				}
				if tc.intermediate {
					expectedRequests++
				}
				if tc.allowed {
					expectedRequests++
					if err != nil || response.Code != http.StatusOK {
						t.Fatalf("same-origin redirect failed: status=%d error=%v", response.Code, err)
					}
					final := requests[len(requests)-1]
					for _, header := range []string{"Authorization", "Cookie", "X-Api-Key", "Arbitrary-Credential"} {
						if final.Header.Get(header) == "" {
							t.Errorf("same-origin request lost %s", header)
						}
					}
				} else {
					if err == nil || response.Code != http.StatusServiceUnavailable {
						t.Fatalf("cross-origin redirect accepted: status=%d error=%v", response.Code, err)
					}
					if response.Header().Get("Location") != "" {
						t.Error("response lets the browser follow the unsafe redirect")
					}
				}
				if len(requests) != expectedRequests {
					t.Errorf("sent %d requests, want %d", len(requests), expectedRequests)
				}
			})
		}
	}
}

func TestForwardedLocation(t *testing.T) {
	proxyServer := NewProxyServer(true)

	tests := []struct {
		name     string
		method   string
		status   int
		location string
		body     string
	}{
		// Browsers read `\` as `/`, so this would be //attacker.example/
		{name: "backslash after a slash", method: http.MethodPost, status: http.StatusTemporaryRedirect, location: `/\attacker.example/phish`, body: strings.Repeat("a", maxReplayableBodySize+1)},
		{name: "double backslash", method: http.MethodPost, status: http.StatusPermanentRedirect, location: `\\attacker.example/phish`, body: strings.Repeat("a", maxReplayableBodySize+1)},
		// Go does not follow a 300, so the response reaches the browser on GET too
		{name: "status not followed by Go", method: http.MethodGet, status: http.StatusMultipleChoices, location: `/\attacker.example/phish`},
	}

	for _, tc := range tests {
		t.Run("Passes on the validated absolute URL without redirecting for "+tc.name, func(t *testing.T) {
			targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
				io.Copy(io.Discard, r.Body)
				w.Header().Set("Location", tc.location)
				w.WriteHeader(tc.status)
			})
			defer targetServer.server.Close()

			// A body over the replay limit makes Go return a 307/308 as-is
			req := httptest.NewRequest(tc.method, "/?scalar_url="+url.QueryEscape(targetServer.url+"/start"), strings.NewReader(tc.body))
			w := httptest.NewRecorder()

			proxyServer.handleRequest(w, req)

			if w.Code != tc.status {
				t.Fatalf("Expected status code %d, got %d", tc.status, w.Code)
			}

			// Browsers must not follow it, the API client shows it as Location
			if got := w.Header().Values("Location"); len(got) != 0 {
				t.Errorf("Expected no Location, got %v", got)
			}

			location := w.Header().Get("X-Scalar-Original-Location")
			forwarded, err := url.Parse(location)
			if err != nil {
				t.Fatalf("Expected a valid Location, got %q: %v", location, err)
			}

			target, _ := url.Parse(targetServer.url)
			if !forwarded.IsAbs() || forwarded.Host != target.Host || strings.Contains(location, `\`) {
				t.Errorf("Expected an absolute same-origin Location without backslashes, got %q", location)
			}
		})
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
			body, release := proxyServer.replayableBody(io.NopCloser(iotest.DataErrReader(strings.NewReader(strings.Repeat("a", tc.size)))), -1)
			received, _ := io.ReadAll(body)
			replay, _ := body.getBody()
			defer replay.Close()
			defer release()
			defer body.Close()

			if _, ok := replay.(*bufferedBodyReader); ok != tc.replayable {
				t.Errorf("%d bytes: expected replayable to be %v, got %v", tc.size, tc.replayable, ok)
			}

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
			body, release := proxyServer.replayableBody(io.NopCloser(io.LimitReader(zeroBodyReader{}, maxReplayableBodySize)), -1)
			io.Copy(io.Discard, body)
			replay, _ := body.getBody()
			if _, ok := replay.(*bufferedBodyReader); ok {
				replayable++
			}
			releases = append(releases, func() {
				body.Close()
				replay.Close()
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

func TestMultipleLocations(t *testing.T) {
	proxyServer := NewProxyServer(true)

	t.Run("Rejects a redirect hidden behind an empty first Location", func(t *testing.T) {
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Add("Location", "")
			w.Header().Add("Location", "https://attacker.example/phish")
			w.WriteHeader(http.StatusFound)
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if w.Code != http.StatusServiceUnavailable {
			t.Errorf("Expected status code %d, got %d", http.StatusServiceUnavailable, w.Code)
		}
		if got := w.Header().Values("Location"); len(got) != 0 {
			t.Errorf("Expected no Location, got %v", got)
		}
	})

	t.Run("Rejects two non-empty Locations", func(t *testing.T) {
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Add("Location", "/same-origin")
			w.Header().Add("Location", "https://attacker.example/phish")
			w.WriteHeader(http.StatusMultipleChoices)
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if w.Code != http.StatusServiceUnavailable {
			t.Errorf("Expected status code %d, got %d", http.StatusServiceUnavailable, w.Code)
		}
	})

	t.Run("Drops an empty Location without failing the request", func(t *testing.T) {
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Add("Location", "")
			w.WriteHeader(http.StatusMultipleChoices)
			w.Write([]byte("choices"))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if w.Code != http.StatusMultipleChoices || w.Body.String() != "choices" {
			t.Errorf("Expected the 300 response, got %d %q", w.Code, w.Body.String())
		}
		if got := w.Header().Values("Location"); len(got) != 0 {
			t.Errorf("Expected no Location, got %v", got)
		}
	})
}
