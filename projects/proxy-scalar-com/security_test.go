package main

import (
	"bufio"
	"context"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"testing"
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
					for _, header := range []string{"Authorization", "Proxy-Authorization", "Cookie", "X-Api-Key", "Arbitrary-Credential"} {
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

func TestLocalNAT64Addresses(t *testing.T) {
	// RFC 6052 permits multiple IPv4 offsets. Block the entire RFC 8215 local
	// translation prefix rather than interpreting every address as a /96.
	for _, address := range []string{
		"64:ff9b:1:0:c0:a801:100:0", // /64 translation of 192.168.1.1
		"64:ff9b:1::a9fe:a9fe",      // /96 translation of metadata address
		"64:ff9b:1::808:808",        // public destinations in the local-use prefix also blocked
	} {
		t.Run(address, func(t *testing.T) {
			if !ipIsBlocked(net.ParseIP(address)) {
				t.Error("local translation address allowed")
			}
			proxy := NewProxyServer(false)
			remote := "http://" + net.JoinHostPort(address, "80")
			if _, errors := proxy.validateScalarURL(remote); len(errors) == 0 {
				t.Error("URL validation accepted local translation address")
			}
			if _, err := proxy.transport.DialContext(context.Background(), "tcp", net.JoinHostPort(address, "80")); err == nil || !strings.Contains(err.Error(), "blocked") {
				t.Errorf("dial did not block translation address: %v", err)
			}
		})
	}
	// Sharing the first 32 bits does not make an address part of 64:ff9b::/96.
	if embedded := embeddedIPv4s(net.ParseIP("64:ff9b:2::c0a8:101")); len(embedded) != 0 {
		t.Errorf("decoded unrelated prefix: %v", embedded)
	}
}
