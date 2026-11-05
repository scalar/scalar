package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sync/atomic"
	"testing"
)

func TestProxyRejectsSelfRecursion(t *testing.T) {
	proxy := NewProxyServer(true)
	defer proxy.transport.CloseIdleConnections()
	var requests atomic.Int64
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests.Add(1)
		proxy.handleRequest(w, r)
	}))
	defer server.Close()
	target := server.URL + "/ping"
	for range 4 {
		target = server.URL + "/?scalar_url=" + url.QueryEscape(target)
	}
	response, err := http.Get(target)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	io.Copy(io.Discard, response.Body)
	if response.StatusCode != http.StatusLoopDetected {
		t.Errorf("got status %d, want loop detected", response.StatusCode)
	}
	if got := requests.Load(); got != 1 {
		t.Errorf("one request caused %d proxy invocations", got)
	}
}

func TestProxyRejectsRepeatedHop(t *testing.T) {
	for _, value := range []string{"1", "", "0"} {
		t.Run("value="+value, func(t *testing.T) {
			var calls atomic.Int64
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { calls.Add(1) }))
			defer upstream.Close()
			proxy := NewProxyServer(true)
			defer proxy.transport.CloseIdleConnections()
			request := httptest.NewRequest(http.MethodGet, "http://proxy.example/?scalar_url="+url.QueryEscape(upstream.URL), nil)
			request.Header.Set("X-Scalar-Proxy-Hop", value)
			response := httptest.NewRecorder()
			proxy.handleRequest(response, request)
			if response.Code != http.StatusLoopDetected {
				t.Errorf("got status %d, want loop detected", response.Code)
			}
			if calls.Load() != 0 {
				t.Errorf("forwarded a repeated proxy hop")
			}
		})
	}
}

func TestProxyRejectsHopMarkerRemoval(t *testing.T) {
	var calls atomic.Int64
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { calls.Add(1) }))
	defer upstream.Close()
	proxy := NewProxyServer(true)
	defer proxy.transport.CloseIdleConnections()
	request := httptest.NewRequest(http.MethodGet, "http://proxy.example/?scalar_url="+url.QueryEscape(upstream.URL), nil)
	request.Header.Add("Connection", "keep-alive")
	request.Header.Add("Connection", "upgrade, x-sCaLaR-pRoXy-hOp")
	response := httptest.NewRecorder()
	proxy.handleRequest(response, request)
	if response.Code != http.StatusLoopDetected {
		t.Errorf("got status %d, want loop detected", response.Code)
	}
	if calls.Load() != 0 {
		t.Fatal("forwarded a request that could remove the loop marker")
	}
}

func TestProxyRejectsRecursionThroughAlias(t *testing.T) {
	proxy := NewProxyServer(true)
	defer proxy.transport.CloseIdleConnections()
	var calls atomic.Int64
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		proxy.handleRequest(w, r)
	}))
	defer server.Close()
	target := server.URL + "/?scalar_url=" + url.QueryEscape(server.URL+"/ping")
	request, err := http.NewRequest(http.MethodGet, server.URL+"/?scalar_url="+url.QueryEscape(target), nil)
	if err != nil {
		t.Fatal(err)
	}
	request.Host = "proxy-alias.example"
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	io.Copy(io.Discard, response.Body)
	if response.StatusCode != http.StatusLoopDetected {
		t.Errorf("got status %d, want loop detected", response.StatusCode)
	}
	if calls.Load() != 2 {
		t.Errorf("got %d proxy invocations, want exactly two", calls.Load())
	}
}

func TestProxyPreservesHopMarkerThroughRedirect(t *testing.T) {
	var marked atomic.Int64
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-Scalar-Proxy-Hop") == "1" {
			marked.Add(1)
		}
		if r.URL.Path == "/start" {
			http.Redirect(w, r, "/end", http.StatusFound)
			return
		}
		io.WriteString(w, "API response")
	}))
	defer upstream.Close()
	proxy := NewProxyServer(true)
	defer proxy.transport.CloseIdleConnections()
	server := httptest.NewServer(http.HandlerFunc(proxy.handleRequest))
	defer server.Close()
	response, err := http.Get(server.URL + "/?scalar_url=" + url.QueryEscape(upstream.URL+"/start"))
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != http.StatusOK || string(body) != "API response" {
		t.Errorf("got %d %q", response.StatusCode, body)
	}
	if marked.Load() != 2 {
		t.Errorf("got %d marked requests, want both redirect hops", marked.Load())
	}
}

func TestIsProxyDestination(t *testing.T) {
	for _, tc := range []struct {
		name, incoming, target string
		want                   bool
	}{
		{"hostname casing", "proxy.example", "https://PROXY.EXAMPLE/", true},
		{"trailing dot", "proxy.example", "https://proxy.example./", true},
		{"explicit HTTPS port", "proxy.example", "https://proxy.example:443/", true},
		{"explicit HTTP port", "proxy.example", "http://proxy.example:80/", true},
		{"incoming default port", "proxy.example:443", "https://proxy.example/", true},
		{"custom port", "proxy.example:1337", "http://proxy.example:1337/", true},
		{"different port", "proxy.example:1337", "http://proxy.example:5052/", false},
		{"different hostname", "proxy.example", "https://api.example/", false},
		{"IPv6 spelling", "[::1]:1337", "http://[0:0:0:0:0:0:0:1]:1337/", true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			remote, err := url.Parse(tc.target)
			if err != nil {
				t.Fatal(err)
			}
			if got := isProxyDestination(remote, tc.incoming); got != tc.want {
				t.Errorf("got %v, want %v", got, tc.want)
			}
		})
	}
}
