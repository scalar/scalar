package main

import (
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"sync/atomic"
	"testing"
)

// TestProxyFixtureServer serves local fixtures for integration suites. Keeping
// this entry point in a test file excludes it from normal builds and go run.
func TestProxyFixtureServer(t *testing.T) {
	if os.Getenv("SCALAR_PROXY_FIXTURE_SERVER") != "1" {
		t.Skip("integration fixture server only")
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "5051"
	}
	proxy := NewProxyServer(true)
	defer proxy.transport.CloseIdleConnections()
	mux := http.NewServeMux()
	mux.HandleFunc("/", proxy.handleRequest)
	server := &http.Server{Addr: net.JoinHostPort("127.0.0.1", port), Handler: corsMiddleware(mux)}
	defer server.Close()
	if err := server.ListenAndServe(); err != nil {
		t.Fatal(err)
	}
}

func TestFixtureServerCanAccessPrivateTargets(t *testing.T) {
	var calls atomic.Int64
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { calls.Add(1); io.WriteString(w, "fixture") }))
	defer upstream.Close()
	address := startProxySubprocess(t, "TestProxyFixtureServer", []string{"SCALAR_PROXY_FIXTURE_SERVER=1"})
	response, err := http.Get("http://" + address + "/?scalar_url=" + url.QueryEscape(upstream.URL))
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != http.StatusOK || string(body) != "fixture" || calls.Load() != 1 {
		t.Fatalf("fixture request: status=%d body=%q calls=%d", response.StatusCode, body, calls.Load())
	}
}

func TestFixtureFlagDoesNotEnableRuntimePrivateAccess(t *testing.T) {
	var calls atomic.Int64
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { calls.Add(1) }))
	defer upstream.Close()
	address := startProxySubprocess(t, "TestProxyStartupProcess", []string{"SCALAR_PROXY_STARTUP_TEST=1", "SCALAR_PROXY_FIXTURE_SERVER=1", "ALLOW_PRIVATE_ADDRESSES=true", "ENV=dev"})
	response, err := http.Get("http://" + address + "/?scalar_url=" + url.QueryEscape(upstream.URL))
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusForbidden || calls.Load() != 0 {
		t.Fatalf("runtime reached private service: status=%d calls=%d", response.StatusCode, calls.Load())
	}
}
