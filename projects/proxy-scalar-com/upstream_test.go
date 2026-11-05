package main

import (
	"bytes"
	"context"
	"crypto/x509"
	"log"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
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

	t.Run("cancels the upstream request when the client goes away", func(t *testing.T) {
		server, started, cancelled := blockingServer(t)
		ps := NewProxyServer(true)

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(server.URL), nil).WithContext(ctx)
		go ps.handleRequest(httptest.NewRecorder(), req)

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
	})
}

func TestSelfProxying(t *testing.T) {
	t.Run("refuses a target on the host the request came in on", func(t *testing.T) {
		ps := NewProxyServer(true)
		hits := &atomic.Int32{}
		proxy := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			hits.Add(1)
			ps.handleRequest(w, r)
		}))
		defer proxy.Close()

		resp, err := http.Get(proxy.URL + "/?scalar_url=" + url.QueryEscape(proxy.URL+"/ping"))
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("Expected status code %d, got %d", http.StatusBadRequest, resp.StatusCode)
		}
		if hits.Load() != 1 {
			t.Errorf("Expected the proxy to receive only the original request, got %d", hits.Load())
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

	for _, header := range []string{"Connection", "X-Hop", "Keep-Alive", "Proxy-Authenticate", "Proxy-Connection", "Proxy-Custom", "Te", "Trailer", "Transfer-Encoding", "Upgrade", "X-Scalar-Original-Content-Security-Policy", "X-Scalar-Original-Cache-Control"} {
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

func TestErrorLogs(t *testing.T) {
	var logs bytes.Buffer
	log.SetOutput(&logs)
	t.Cleanup(func() { log.SetOutput(os.Stderr) })

	// Nothing listens on port 1, so the request fails and the error is logged.
	w := proxyGet(NewProxyServer(true), "http://user:hunter2@127.0.0.1:1/path?api_key=secret-value#fragment")

	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("Expected status code %d, got %d", http.StatusServiceUnavailable, w.Code)
	}
	if !strings.Contains(logs.String(), "127.0.0.1:1/path") {
		t.Errorf("Expected the log to name the target, got %q", logs.String())
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

	if server.ReadHeaderTimeout <= 0 || server.ReadTimeout <= 0 || server.IdleTimeout <= 0 {
		t.Errorf("Expected read header, read, and idle timeouts, got %v, %v, %v", server.ReadHeaderTimeout, server.ReadTimeout, server.IdleTimeout)
	}

	// A write timeout would cut off streamed responses
	if server.WriteTimeout != 0 {
		t.Errorf("Expected no write timeout, got %v", server.WriteTimeout)
	}
}
