package main

import (
	"bufio"
	"bytes"
	"context"
	"crypto/x509"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// countingTLSServer starts an HTTPS upstream that counts the requests it receives.
func countingTLSServer(t *testing.T) (*httptest.Server, *atomic.Int32) {
	t.Helper()

	hits := &atomic.Int32{}
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
		w.Write([]byte("secret upstream response"))
	}))
	t.Cleanup(server.Close)

	return server, hits
}

// trustCertificate makes the proxy trust the certificate of a test server, the
// way it trusts a public CA in production.
func trustCertificate(ps *ProxyServer, server *httptest.Server) {
	pool := x509.NewCertPool()
	pool.AddCert(server.Certificate())
	ps.transport.TLSClientConfig.RootCAs = pool
}

func proxyGet(ps *ProxyServer, target string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(target), nil)
	w := httptest.NewRecorder()
	ps.handleRequest(w, req)

	return w
}

func TestUpstreamTLS(t *testing.T) {
	t.Run("refuses an upstream with an untrusted certificate", func(t *testing.T) {
		server, hits := countingTLSServer(t)
		ps := NewProxyServerWithConfig(ProxyConfig{BypassCidr: true})

		w := proxyGet(ps, server.URL)

		if w.Code != http.StatusServiceUnavailable {
			t.Errorf("Expected status code %d, got %d", http.StatusServiceUnavailable, w.Code)
		}
		if hits.Load() != 0 {
			t.Errorf("Expected the upstream to receive no request, got %d", hits.Load())
		}
	})

	t.Run("refuses an upstream whose certificate does not match the hostname", func(t *testing.T) {
		server, hits := countingTLSServer(t)
		ps := NewProxyServerWithConfig(ProxyConfig{BypassCidr: true})
		trustCertificate(ps, server)

		// The certificate is trusted, but issued for other names. Dial the test
		// server for any hostname, so only the name check can refuse it.
		addr := server.Listener.Addr().String()
		ps.transport.DialContext = func(ctx context.Context, network, _ string) (net.Conn, error) {
			return (&net.Dialer{}).DialContext(ctx, network, addr)
		}
		_, port, _ := net.SplitHostPort(addr)

		w := proxyGet(ps, "https://wrong-name.test:"+port+"/")

		if w.Code != http.StatusServiceUnavailable {
			t.Errorf("Expected status code %d, got %d", http.StatusServiceUnavailable, w.Code)
		}
		if hits.Load() != 0 {
			t.Errorf("Expected the upstream to receive no request, got %d", hits.Load())
		}
	})

	t.Run("accepts an upstream with a trusted certificate", func(t *testing.T) {
		server, hits := countingTLSServer(t)
		ps := NewProxyServerWithConfig(ProxyConfig{BypassCidr: true})
		trustCertificate(ps, server)

		w := proxyGet(ps, server.URL)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d: %s", http.StatusOK, w.Code, w.Body.String())
		}
		if hits.Load() != 1 {
			t.Errorf("Expected the upstream to receive one request, got %d", hits.Load())
		}
	})

	t.Run("skips verification when insecure upstream TLS is allowed", func(t *testing.T) {
		server, _ := countingTLSServer(t)
		ps := NewProxyServerWithConfig(ProxyConfig{BypassCidr: true, AllowInsecureUpstreamTLS: true})

		w := proxyGet(ps, server.URL)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
	})

	t.Run("skips verification in development mode", func(t *testing.T) {
		server, _ := countingTLSServer(t)

		w := proxyGet(NewProxyServer(true), server.URL)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
	})
}

// blockingServer starts an upstream that accepts requests but never answers. It
// reports each request it receives and each request that was cancelled.
func blockingServer(t *testing.T) (server *httptest.Server, started chan struct{}, cancelled chan struct{}) {
	t.Helper()

	started = make(chan struct{}, 1)
	cancelled = make(chan struct{}, 1)
	release := make(chan struct{})

	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started <- struct{}{}
		select {
		case <-r.Context().Done():
			cancelled <- struct{}{}
		case <-release:
		}
	}))
	t.Cleanup(func() {
		close(release)
		server.Close()
	})

	return server, started, cancelled
}

func TestUpstreamTimeouts(t *testing.T) {
	t.Run("fails when the upstream never sends response headers", func(t *testing.T) {
		server, _, _ := blockingServer(t)
		ps := NewProxyServerWithConfig(ProxyConfig{BypassCidr: true, ResponseHeaderTimeout: 100 * time.Millisecond})

		done := make(chan *httptest.ResponseRecorder, 1)
		go func() { done <- proxyGet(ps, server.URL) }()

		select {
		case w := <-done:
			if w.Code != http.StatusGatewayTimeout {
				t.Errorf("Expected status code %d, got %d", http.StatusGatewayTimeout, w.Code)
			}
		case <-time.After(3 * time.Second):
			t.Fatal("Expected the proxy to give up on the upstream")
		}
	})

	t.Run("keeps streaming a response body past the response header timeout", func(t *testing.T) {
		server := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/event-stream")
			w.WriteHeader(http.StatusOK)
			for i := range 4 {
				fmt.Fprintf(w, "data: %d\n\n", i)
				w.(http.Flusher).Flush()
				time.Sleep(100 * time.Millisecond)
			}
		})
		defer server.server.Close()

		ps := NewProxyServerWithConfig(ProxyConfig{BypassCidr: true, ResponseHeaderTimeout: 50 * time.Millisecond})
		w := proxyGet(ps, server.url)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
		if want := "data: 0\n\ndata: 1\n\ndata: 2\n\ndata: 3\n\n"; w.Body.String() != want {
			t.Errorf("Expected the whole stream, got %q", w.Body.String())
		}
	})

	t.Run("cancels the upstream request when the client goes away", func(t *testing.T) {
		server, started, cancelled := blockingServer(t)
		ps := NewProxyServer(true)
		logs := captureLogs(t)

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(server.URL), nil).WithContext(ctx)
		w := httptest.NewRecorder()
		done := make(chan struct{})
		go func() {
			ps.handleRequest(w, req)
			close(done)
		}()

		select {
		case <-started:
		case <-time.After(3 * time.Second):
			t.Fatal("Expected the upstream to receive the request")
		}

		cancel()

		select {
		case <-cancelled:
		case <-time.After(3 * time.Second):
			t.Fatal("Expected the upstream request to be cancelled")
		}

		<-done

		// Nobody is left to read an error, and the client leaving is not one
		if w.Body.Len() != 0 {
			t.Errorf("Expected no response, got %q", w.Body.String())
		}
		if logs.String() != "" {
			t.Errorf("Expected nothing to be logged, got %q", logs.String())
		}
	})

	t.Run("stays quiet when the client leaves during a stream", func(t *testing.T) {
		upstreamDone := make(chan struct{})
		upstream := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			defer close(upstreamDone)
			w.Header().Set("Content-Type", "text/event-stream")
			for {
				fmt.Fprint(w, "data: tick\n\n")
				w.(http.Flusher).Flush()
				select {
				case <-r.Context().Done():
					return
				case <-time.After(20 * time.Millisecond):
				}
			}
		})
		defer upstream.server.Close()

		proxyDone := make(chan struct{})
		ps := NewProxyServer(true)
		proxy := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer close(proxyDone)
			ps.handleRequest(w, r)
		}))
		defer proxy.Close()
		logs := captureLogs(t)

		resp, err := http.Get(proxy.URL + "/?scalar_url=" + url.QueryEscape(upstream.url))
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		if _, err := readSSEEvent(bufio.NewReader(resp.Body)); err != nil {
			t.Fatalf("Expected an event, got %v", err)
		}
		resp.Body.Close()

		for _, done := range []chan struct{}{upstreamDone, proxyDone} {
			select {
			case <-done:
			case <-time.After(3 * time.Second):
				t.Fatal("Expected the stream to stop when the client left")
			}
		}

		if logs.String() != "" {
			t.Errorf("Expected nothing to be logged, got %q", logs.String())
		}
	})
}

func TestSelfProxying(t *testing.T) {
	t.Run("allows targets on the host the request came in on", func(t *testing.T) {
		// Behind a gateway that routes by path, the proxy and the API share a host
		server := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("api"))
		})
		defer server.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(server.url+"/api/users"), nil)
		req.Host = strings.TrimPrefix(server.url, "http://")
		w := httptest.NewRecorder()
		NewProxyServer(true).handleRequest(w, req)

		if w.Code != http.StatusOK || w.Body.String() != "api" {
			t.Errorf("Expected the API response, got %d %q", w.Code, w.Body.String())
		}
	})

	t.Run("stops a loop through the host the request came in on", func(t *testing.T) {
		ps := NewProxyServer(true)
		hits := &atomic.Int32{}
		proxy := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			hits.Add(1)
			ps.handleRequest(w, r)
		}))
		defer proxy.Close()

		upstreamHits := &atomic.Int32{}
		upstream := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			upstreamHits.Add(1)
		})
		defer upstream.server.Close()

		inner := proxy.URL + "/?scalar_url=" + url.QueryEscape(upstream.url)
		resp, err := http.Get(proxy.URL + "/?scalar_url=" + url.QueryEscape(inner))
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusLoopDetected {
			t.Errorf("Expected status code %d, got %d", http.StatusLoopDetected, resp.StatusCode)
		}
		if hits.Load() != 2 {
			t.Errorf("Expected the proxy to receive two requests, got %d", hits.Load())
		}
		if upstreamHits.Load() != 0 {
			t.Errorf("Expected the upstream to receive no request, got %d", upstreamHits.Load())
		}
	})

	t.Run("does not let the client remove the loop marker", func(t *testing.T) {
		received := make(chan http.Header, 1)
		server := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			received <- r.Header.Clone()
		})
		defer server.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(server.url), nil)
		req.Header.Set("Connection", "X-Scalar-Proxy-Hop, X-Listed")
		req.Header.Set("X-Listed", "1")
		req.Header.Set("Keep-Alive", "timeout=5")
		req.Header.Set("Upgrade", "h2c")
		req.Header.Set("Proxy-Authorization", "Basic dXNlcjpwYXNz")
		NewProxyServer(true).handleRequest(httptest.NewRecorder(), req)

		var header http.Header
		select {
		case header = <-received:
		case <-time.After(3 * time.Second):
			t.Fatal("Expected the upstream to receive the request")
		}
		if got := header.Get(proxyHopHeader); got != "1" {
			t.Errorf("Expected the loop marker, got %q", got)
		}
		for _, name := range []string{"X-Listed", "Keep-Alive", "Upgrade"} {
			if value := header.Values(name); len(value) > 0 {
				t.Errorf("Expected %s to be removed, got %q", name, value)
			}
		}
		if strings.Contains(strings.ToLower(header.Get("Connection")), "proxy-hop") {
			t.Errorf("Expected Connection not to name the loop marker, got %q", header.Get("Connection"))
		}
		if got := header.Get("Proxy-Authorization"); got != "" {
			t.Errorf("Expected connection-scoped Proxy-Authorization to be removed, got %q", got)
		}
	})

	t.Run("refuses a target on a configured proxy host", func(t *testing.T) {
		ps := NewProxyServerWithConfig(ProxyConfig{BypassCidr: true, SelfHosts: []string{"proxy.example", "other.example:8443"}})

		for _, target := range []string{
			"https://proxy.example/ping",
			"https://PROXY.example:9000/ping",
			"https://other.example:8443/ping",
		} {
			if w := proxyGet(ps, target); w.Code != http.StatusBadRequest {
				t.Errorf("Expected status code %d for %s, got %d", http.StatusBadRequest, target, w.Code)
			}
		}
	})

	t.Run("allows other ports when a configured proxy host has a port", func(t *testing.T) {
		server := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("ok"))
		})
		defer server.server.Close()

		host := server.server.Listener.Addr().(*net.TCPAddr).IP.String()
		ps := NewProxyServerWithConfig(ProxyConfig{BypassCidr: true, SelfHosts: []string{host + ":1"}})

		if w := proxyGet(ps, server.url); w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
	})

	t.Run("refuses requests that already passed through a proxy", func(t *testing.T) {
		hits := &atomic.Int32{}
		server := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			hits.Add(1)
		})
		defer server.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(server.url), nil)
		req.Header.Set(proxyHopHeader, "1")
		w := httptest.NewRecorder()
		NewProxyServer(true).handleRequest(w, req)

		if w.Code != http.StatusLoopDetected {
			t.Errorf("Expected status code %d, got %d", http.StatusLoopDetected, w.Code)
		}
		if hits.Load() != 0 {
			t.Errorf("Expected the upstream to receive no request, got %d", hits.Load())
		}
	})

	t.Run("matches configured proxy hosts in any spelling", func(t *testing.T) {
		ps := NewProxyServerWithConfig(ProxyConfig{BypassCidr: true, SelfHosts: []string{"Proxy.Example.", "[::1]:8080"}})

		for _, target := range []string{
			"https://proxy.example/",
			"https://proxy.example./",
			"http://[::1]:8080/",
		} {
			if w := proxyGet(ps, target); w.Code != http.StatusBadRequest {
				t.Errorf("Expected status code %d for %s, got %d", http.StatusBadRequest, target, w.Code)
			}
		}
	})

	t.Run("ignores empty configured proxy hosts", func(t *testing.T) {
		server := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("ok"))
		})
		defer server.server.Close()

		ps := NewProxyServerWithConfig(ProxyConfig{BypassCidr: true, SelfHosts: []string{"", " "}})

		if w := proxyGet(ps, server.url); w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
	})

	t.Run("marks outgoing requests, also after a redirect", func(t *testing.T) {
		marks := make(chan string, 2)
		server := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			marks <- r.URL.Path + "=" + r.Header.Get(proxyHopHeader)
			if r.URL.Path == "/start" {
				http.Redirect(w, r, "/end", http.StatusFound)
			}
		})
		defer server.server.Close()

		if w := proxyGet(NewProxyServer(true), server.url+"/start"); w.Code != http.StatusOK {
			t.Fatalf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}

		for _, want := range []string{"/start=1", "/end=1"} {
			if got := <-marks; got != want {
				t.Errorf("Expected %q, got %q", want, got)
			}
		}
	})

	t.Run("refuses a loop through another name for the proxy", func(t *testing.T) {
		// The second proxy stands in for this proxy reached under a hostname that
		// is not configured. It must see that the request was proxied already.
		second := httptest.NewServer(http.HandlerFunc(NewProxyServer(true).handleRequest))
		defer second.Close()

		hits := &atomic.Int32{}
		upstream := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			hits.Add(1)
		})
		defer upstream.server.Close()

		w := proxyGet(NewProxyServer(true), second.URL+"/?scalar_url="+url.QueryEscape(upstream.url))

		if w.Code != http.StatusLoopDetected {
			t.Errorf("Expected status code %d, got %d", http.StatusLoopDetected, w.Code)
		}
		if hits.Load() != 0 {
			t.Errorf("Expected the upstream to receive no request, got %d", hits.Load())
		}
	})
}

func TestHopByHopResponseHeaders(t *testing.T) {
	server := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Connection", "X-Hop, Content-Security-Policy, X-Content-Type-Options, Cache-Control")
		w.Header().Set("X-Hop", "1")
		w.Header().Add("Connection", " x-second-hop ,")
		w.Header().Set("X-Second-Hop", "1")
		w.Header().Set("Content-Security-Policy", "default-src *")
		w.Header().Set("X-Content-Type-Options", "sniff")
		w.Header().Set("Cache-Control", "public, max-age=60")
		w.Header().Set("Keep-Alive", "timeout=5")
		w.Header().Set("Proxy-Authenticate", "Basic")
		w.Header().Set("Proxy-Connection", "keep-alive")
		w.Header().Set("Proxy-Custom", "1")
		w.Header().Set("Te", "trailers")
		w.Header().Set("Trailer", "X-Checksum")
		w.Header().Set("Upgrade", "h2c")
		w.Header().Set("X-End-To-End", "kept")
		w.Write([]byte("ok"))
	})
	defer server.server.Close()

	w := proxyGet(NewProxyServer(true), server.url)

	for _, header := range []string{"Connection", "X-Hop", "X-Second-Hop", "Keep-Alive", "Proxy-Authenticate", "Proxy-Connection", "Proxy-Custom", "Te", "Trailer", "Transfer-Encoding", "Upgrade", "X-Scalar-Original-Content-Security-Policy", "X-Scalar-Original-Cache-Control"} {
		if value := w.Header().Values(header); len(value) > 0 {
			t.Errorf("Expected %s to be removed, got %q", header, value)
		}
	}

	if got := w.Header().Get("X-End-To-End"); got != "kept" {
		t.Errorf("Expected X-End-To-End to be forwarded, got %q", got)
	}
	if got := w.Header().Get("Content-Security-Policy"); got != untrustedContentSecurityPolicy {
		t.Errorf("Expected the proxy's own Content-Security-Policy, got %q", got)
	}
	if got := w.Header().Get("X-Content-Type-Options"); got != "nosniff" {
		t.Errorf("Expected X-Content-Type-Options to be nosniff, got %q", got)
	}
	if got := w.Header().Get("Cache-Control"); got != "private" {
		t.Errorf("Expected Cache-Control to be private, got %q", got)
	}
	if got := w.Header().Get("Vary"); got != "Sec-Fetch-Mode, Sec-Fetch-Dest" {
		t.Errorf("Expected the proxy's own Vary, got %q", got)
	}
}

// lockedBuffer is a bytes.Buffer that handlers on other goroutines can log to.
type lockedBuffer struct {
	mu  sync.Mutex
	buf bytes.Buffer
}

func (b *lockedBuffer) Write(p []byte) (int, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buf.Write(p)
}

func (b *lockedBuffer) String() string {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buf.String()
}

// captureLogs collects what the proxy logs for the rest of the test.
func captureLogs(t *testing.T) *lockedBuffer {
	t.Helper()

	logs := &lockedBuffer{}
	log.SetOutput(logs)
	t.Cleanup(func() { log.SetOutput(os.Stderr) })

	return logs
}

func TestErrorLogs(t *testing.T) {
	logs := captureLogs(t)

	// Nothing listens on port 1, so the request fails and the error is logged.
	w := proxyGet(NewProxyServer(true), "http://user:hunter2@127.0.0.1:1/path?api_key=secret-value#fragment")

	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("Expected status code %d, got %d", http.StatusServiceUnavailable, w.Code)
	}
	if !strings.Contains(logs.String(), "network failure") {
		t.Errorf("Expected a safe network failure category, got %q", logs.String())
	}
	for _, secret := range []string{"secret-value", "api_key", "hunter2", "fragment"} {
		if strings.Contains(logs.String(), secret) {
			t.Errorf("Expected the log not to contain %q, got %q", secret, logs.String())
		}
	}
}

func TestListenAddress(t *testing.T) {
	cases := []struct {
		name string
		dev  bool
		host string
		want string
	}{
		{name: "listens on every interface in production", dev: false, host: "", want: ":5051"},
		{name: "listens on loopback in development mode", dev: true, host: "", want: "127.0.0.1:5051"},
		{name: "listens on an explicit host in development mode", dev: true, host: "0.0.0.0", want: "0.0.0.0:5051"},
		{name: "wraps an IPv6 host in brackets", dev: true, host: "::1", want: "[::1]:5051"},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := listenAddress(c.dev, c.host, "5051"); got != c.want {
				t.Errorf("Expected %q, got %q", c.want, got)
			}
		})
	}
}

func TestHTTPServerTimeouts(t *testing.T) {
	server := newHTTPServer(":0", http.NotFoundHandler())

	if server.ReadHeaderTimeout <= 0 || server.IdleTimeout <= 0 {
		t.Errorf("Expected read header and idle timeouts, got %v, %v", server.ReadHeaderTimeout, server.IdleTimeout)
	}

	// Incoming uploads use an idle deadline that refreshes on each body read.
	if server.ReadTimeout != 0 {
		t.Errorf("Expected no fixed read timeout, got %v", server.ReadTimeout)
	}

	// A write timeout would cut off streamed responses
	if server.WriteTimeout != 0 {
		t.Errorf("Expected no write timeout, got %v", server.WriteTimeout)
	}
}

func TestProxyConfigFromEnv(t *testing.T) {
	env := func(values map[string]string) func(string) string {
		return func(key string) string { return values[key] }
	}

	t.Run("verifies certificates and blocks private networks by default", func(t *testing.T) {
		config := proxyConfigFromEnv(env(map[string]string{}))

		if config.BypassCidr || config.AllowInsecureUpstreamTLS || len(config.SelfHosts) != 0 {
			t.Errorf("Expected a production configuration, got %+v", config)
		}
	})

	t.Run("relaxes checks in development mode", func(t *testing.T) {
		config := proxyConfigFromEnv(env(map[string]string{"ENV": "dev"}))

		if !config.BypassCidr || !config.AllowInsecureUpstreamTLS {
			t.Errorf("Expected a development configuration, got %+v", config)
		}
	})

	t.Run("skips certificate verification only when the flag is true", func(t *testing.T) {
		for value, want := range map[string]bool{"true": true, "1": true, "false": false, "yes": false, "": false} {
			config := proxyConfigFromEnv(env(map[string]string{"ALLOW_INSECURE_UPSTREAM_TLS": value}))

			if config.AllowInsecureUpstreamTLS != want {
				t.Errorf("Expected %v for %q, got %v", want, value, config.AllowInsecureUpstreamTLS)
			}
			if config.BypassCidr {
				t.Errorf("Expected private networks to stay blocked for %q", value)
			}
		}
	})

	t.Run("keeps the host of a URL", func(t *testing.T) {
		config := proxyConfigFromEnv(env(map[string]string{"PROXY_SELF_HOSTS": "https://proxy-xyz.a.run.app,http://proxy.example:8080/path, https://"}))

		if got := strings.Join(config.SelfHosts, "|"); got != "proxy-xyz.a.run.app|proxy.example:8080" {
			t.Errorf("Expected the hosts of the URLs, got %q", got)
		}

		ps := NewProxyServerWithConfig(config)
		if !ps.targetsProxy(&url.URL{Scheme: "https", Host: "proxy-xyz.a.run.app", Path: "/ping"}) {
			t.Error("Expected a target on the Cloud Run host to be refused")
		}
	})

	t.Run("reads a comma-separated list of proxy hosts", func(t *testing.T) {
		config := proxyConfigFromEnv(env(map[string]string{"PROXY_SELF_HOSTS": " proxy.example, ,run.example:443 ,"}))

		if got := strings.Join(config.SelfHosts, "|"); got != "proxy.example|run.example:443" {
			t.Errorf("Expected the trimmed hosts, got %q", got)
		}
	})
}

func TestTruncatedResponses(t *testing.T) {
	// The upstream sends part of a chunked event stream, then drops the
	// connection. The proxy flushes event streams, so the client already has the
	// status and the first bytes.
	upstream := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
		conn, buf, err := w.(http.Hijacker).Hijack()
		if err != nil {
			t.Errorf("Hijack failed: %v", err)
			return
		}
		defer conn.Close()
		buf.WriteString("HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nTransfer-Encoding: chunked\r\n\r\n5\r\nhello\r\n")
		buf.Flush()
	})
	defer upstream.server.Close()

	proxy := httptest.NewServer(http.HandlerFunc(NewProxyServer(true).handleRequest))
	defer proxy.Close()

	resp, err := http.Get(proxy.URL + "/?scalar_url=" + url.QueryEscape(upstream.url))
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err == nil {
		t.Errorf("Expected the client to see an incomplete response, got the complete body %q", body)
	}
	if string(body) != "hello" {
		t.Errorf("Expected the part that was received, got %q", body)
	}
}

// replaceLookup swaps the DNS lookup for the duration of a test.
func replaceLookup(t *testing.T, lookup func(ctx context.Context, host string) ([]net.IP, error)) {
	t.Helper()

	original := lookupIP
	lookupIP = lookup
	t.Cleanup(func() { lookupIP = original })
}

func TestDNSLookups(t *testing.T) {
	for _, tc := range []struct {
		name   string
		err    error
		status int
	}{
		{name: "deadline", err: context.DeadlineExceeded, status: http.StatusGatewayTimeout},
		{name: "DNS timeout", err: &net.DNSError{Err: "timeout", IsTimeout: true}, status: http.StatusGatewayTimeout},
		{name: "DNS failure", err: &net.DNSError{Err: "no such host", IsNotFound: true}, status: http.StatusServiceUnavailable},
	} {
		for _, redirect := range []bool{false, true} {
			t.Run(fmt.Sprintf("%s redirect=%v", tc.name, redirect), func(t *testing.T) {
				upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					http.Redirect(w, r, "/next", http.StatusFound)
				}))
				defer upstream.Close()
				ps := NewProxyServer(false)
				defer ps.transport.CloseIdleConnections()
				ps.transport.DialContext = func(ctx context.Context, network, addr string) (net.Conn, error) {
					return (&net.Dialer{}).DialContext(ctx, network, upstream.Listener.Addr().String())
				}
				lookups := 0
				replaceLookup(t, func(ctx context.Context, host string) ([]net.IP, error) {
					lookups++
					if redirect && lookups == 1 {
						return []net.IP{net.ParseIP("203.0.113.10")}, nil
					}
					return nil, tc.err
				})
				w := proxyGet(ps, "http://dns.test/start")
				if w.Code != tc.status {
					t.Fatalf("Expected status %d, got %d: %s", tc.status, w.Code, w.Body.String())
				}
			})
		}
	}

	t.Run("stops checking the target when the client goes away", func(t *testing.T) {
		started := make(chan struct{}, 1)
		stopped := make(chan struct{}, 1)
		replaceLookup(t, func(ctx context.Context, host string) ([]net.IP, error) {
			started <- struct{}{}
			<-ctx.Done()
			stopped <- struct{}{}
			return nil, ctx.Err()
		})

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape("https://slow-dns.test/"), nil).WithContext(ctx)
		w := httptest.NewRecorder()
		done := make(chan struct{})
		go func() {
			defer close(done)
			NewProxyServer(false).handleRequest(w, req)
		}()

		select {
		case <-started:
		case <-time.After(3 * time.Second):
			t.Fatal("Expected a DNS lookup")
		}

		cancel()

		select {
		case <-stopped:
		case <-time.After(3 * time.Second):
			t.Fatal("Expected the DNS lookup to stop when the client left")
		}
		select {
		case <-done:
		case <-time.After(3 * time.Second):
			t.Fatal("Expected the handler to finish after cancellation")
		}
		if w.Body.Len() != 0 {
			t.Errorf("Expected no response after cancellation, got %q", w.Body.String())
		}
	})

	t.Run("limits how long lookups can take", func(t *testing.T) {
		// The target check is answered, so the dial resolves the host again
		deadlines := make(chan time.Duration, 2)
		replaceLookup(t, func(ctx context.Context, host string) ([]net.IP, error) {
			deadline, ok := ctx.Deadline()
			if !ok {
				deadlines <- -1
			} else {
				deadlines <- time.Until(deadline)
			}
			if len(deadlines) == 1 {
				return []net.IP{net.ParseIP("203.0.113.10")}, nil
			}
			return nil, errors.New("no answer")
		})

		NewProxyServer(false).handleRequest(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape("https://slow-dns.test/"), nil))

		for _, name := range []string{"target check", "dial"} {
			select {
			case remaining := <-deadlines:
				if remaining <= 0 || remaining > dnsTimeout {
					t.Errorf("Expected the %s lookup to end within %v, got %v", name, dnsTimeout, remaining)
				}
			default:
				t.Errorf("Expected a %s lookup", name)
			}
		}
	})
}
