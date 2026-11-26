package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"net/http/httputil"
	"net/url"
	"testing"
)

func TestProxySecurityHeadersSurviveFrontProxy(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Connection", "Content-Security-Policy, X-Content-Type-Options")
		w.Header().Add("Connection", "cache-control, Access-Control-Allow-Origin")
		w.Header().Set("Content-Type", "text/html")
		io.WriteString(w, "<p>upstream</p>")
	}))
	defer upstream.Close()
	proxy := NewProxyServer(true)
	defer proxy.transport.CloseIdleConnections()
	scalar := httptest.NewServer(http.HandlerFunc(proxy.handleRequest))
	defer scalar.Close()
	scalarURL, _ := url.Parse(scalar.URL)
	frontProxy := httputil.NewSingleHostReverseProxy(scalarURL)
	front := httptest.NewServer(frontProxy)
	defer front.Close()
	response, err := http.Get(front.URL + "/?scalar_url=" + url.QueryEscape(upstream.URL))
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != http.StatusOK || string(body) != "<p>upstream</p>" {
		t.Fatalf("got status %d, body %q", response.StatusCode, body)
	}
	for header, want := range map[string]string{
		"Content-Security-Policy":     untrustedContentSecurityPolicy,
		"X-Content-Type-Options":      "nosniff",
		"Cache-Control":               privateCacheControl(nil),
		"Access-Control-Allow-Origin": "*",
	} {
		if got := response.Header.Get(header); got != want {
			t.Errorf("%s = %q, want %q", header, got, want)
		}
	}
}

func TestRemoveHopByHopHeaders(t *testing.T) {
	header := make(http.Header)
	for _, name := range []string{"Connection", "Proxy-Connection", "Keep-Alive", "Proxy-Authenticate", "Proxy-Authorization", "TE", "Trailer", "Transfer-Encoding", "Upgrade"} {
		header.Set(name, "remove")
	}
	header.Set("Connection", " X-First, x-sEcOnD , ,")
	header.Add("Connection", "X-Third")
	for _, name := range []string{"X-First", "X-Second", "X-Third"} {
		header.Set(name, "remove")
	}
	header.Set("Content-Type", "application/json")
	header.Set("X-Api-Version", "1")
	removeHopByHopHeaders(header, header.Values("Connection"))
	if len(header) != 2 || header.Get("Content-Type") != "application/json" || header.Get("X-Api-Version") != "1" {
		t.Errorf("got headers %v", header)
	}
}

func TestProxyStripsRequestHopHeaders(t *testing.T) {
	for _, nominations := range []string{"X-Scalar-Cookie, X-Scalar-Date", "Cookie, Date"} {
		t.Run(nominations, func(t *testing.T) {
			observed := make(chan http.Header, 1)
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				observed <- r.Header.Clone()
				io.WriteString(w, "ok")
			}))
			defer upstream.Close()
			proxy := NewProxyServer(true)
			defer proxy.transport.CloseIdleConnections()
			request := httptest.NewRequest(http.MethodGet, "/", nil)
			request.Header.Set("Connection", nominations)
			request.Header.Add("Connection", "x-rEmOvE")
			request.Header.Set("X-Remove", "connection-only")
			request.Header.Set("X-Scalar-Cookie", "session=connection-only")
			request.Header.Set("X-Scalar-Date", "Wed, 04 Nov 2026 12:00:00 GMT")
			request.Header.Set("Proxy-Authorization", "Basic connection-only")
			request.Header.Set("Keep-Alive", "timeout=5")
			request.Header.Set("Upgrade", "websocket")
			request.Header.Set("Authorization", "Bearer api-token")
			request.Header.Set("X-Api-Key", "api-key")
			remote, _ := url.Parse(upstream.URL)
			if err := proxy.executeProxyRequest(httptest.NewRecorder(), request, remote, upstream.URL); err != nil {
				t.Fatal(err)
			}
			header := <-observed
			for _, name := range []string{"Connection", "X-Remove", "X-Scalar-Cookie", "Cookie", "X-Scalar-Date", "Date", "Proxy-Authorization", "Keep-Alive", "Upgrade"} {
				if got := header.Get(name); got != "" {
					t.Errorf("forwarded %s = %q", name, got)
				}
			}
			if header.Get("Authorization") != "Bearer api-token" || header.Get("X-Api-Key") != "api-key" {
				t.Errorf("lost end-to-end credentials: %v", header)
			}
		})
	}
}

func TestProxyStripsResponseHopHeadersBeforeMirroring(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Connection", "Set-Cookie, Content-Security-Policy, Cache-Control, X-Internal, Location")
		w.Header().Set("Set-Cookie", "session=connection-only")
		w.Header().Set("Content-Security-Policy", "default-src *")
		w.Header().Set("Cache-Control", "public, max-age=3600")
		w.Header().Set("X-Internal", "connection-only")
		w.Header().Set("Location", "/connection-only")
		w.Header().Set("Keep-Alive", "timeout=5")
		w.Header().Set("Proxy-Authenticate", "Basic")
		w.Header().Set("Upgrade", "websocket")
		w.Header().Set("X-Api-Version", "1")
		w.WriteHeader(http.StatusMultipleChoices)
		io.WriteString(w, "ok")
	}))
	defer upstream.Close()
	proxy := NewProxyServer(true)
	defer proxy.transport.CloseIdleConnections()
	remote, _ := url.Parse(upstream.URL)
	response := httptest.NewRecorder()
	if err := proxy.executeProxyRequest(response, httptest.NewRequest(http.MethodGet, "/", nil), remote, upstream.URL); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"Connection", "Set-Cookie", "X-Scalar-Set-Cookie", "X-Scalar-Original-Content-Security-Policy", "X-Scalar-Original-Cache-Control", "X-Scalar-Original-Location", "X-Internal", "Keep-Alive", "Proxy-Authenticate", "Upgrade"} {
		if got := response.Header().Get(name); got != "" {
			t.Errorf("forwarded or mirrored %s = %q", name, got)
		}
	}
	if response.Header().Get("Cache-Control") != "private" || response.Header().Get("X-Api-Version") != "1" || response.Body.String() != "ok" {
		t.Errorf("unexpected response headers %v or body %q", response.Header(), response.Body.String())
	}
}
