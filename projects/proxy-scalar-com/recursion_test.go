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
	if got := requests.Load(); got != 2 {
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

func TestProxyPreservesSameHostAPI(t *testing.T) {
	proxy := NewProxyServer(true)
	defer proxy.transport.CloseIdleConnections()
	var server *httptest.Server
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/users" {
			io.WriteString(w, "users")
			return
		}
		proxy.handleRequest(w, r)
	}))
	defer server.Close()
	response, err := http.Get(server.URL + "/proxy/?scalar_url=" + url.QueryEscape(server.URL+"/api/users"))
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil || response.StatusCode != http.StatusOK || string(body) != "users" {
		t.Fatalf("same-host API failed: %d %q %v", response.StatusCode, body, err)
	}
}

func TestProxyStripsNominationsBeforeSettingMarker(t *testing.T) {
	observed := make(chan http.Header, 1)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { observed <- r.Header.Clone() }))
	defer upstream.Close()
	proxy := NewProxyServer(true)
	defer proxy.transport.CloseIdleConnections()
	request := httptest.NewRequest(http.MethodGet, "/", nil)
	request.Header.Set("Connection", "X-Scalar-Proxy-Hop, X-Remove")
	request.Header.Set("X-Remove", "connection-only")
	remote, _ := url.Parse(upstream.URL)
	if err := proxy.executeProxyRequest(httptest.NewRecorder(), request, remote, upstream.URL); err != nil {
		t.Fatal(err)
	}
	header := <-observed
	if header.Get(proxyHopHeader) != "1" || header.Get("Connection") != "" || header.Get("X-Remove") != "" {
		t.Fatalf("unsafe forwarded headers: %v", header)
	}
}
