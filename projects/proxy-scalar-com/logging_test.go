package main

import (
	"bytes"
	"context"
	"errors"
	"log"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

func captureProxyLogs(t *testing.T) *bytes.Buffer {
	t.Helper()
	var output bytes.Buffer
	writer, flags := log.Writer(), log.Flags()
	log.SetOutput(&output)
	log.SetFlags(0)
	t.Cleanup(func() { log.SetOutput(writer); log.SetFlags(flags) })
	return &output
}

func TestProxyErrorLogsOmitCredentials(t *testing.T) {
	output := captureProxyLogs(t)
	proxy := NewProxyServer(true)
	proxy.transport.DialContext = func(context.Context, string, string) (net.Conn, error) {
		return nil, errors.New("connection failed")
	}
	defer proxy.transport.CloseIdleConnections()
	target := "http://secret-user:secret-password@api.example/secret-path?api_key=secret-key#secret-fragment"
	request := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(target), nil)
	response := httptest.NewRecorder()
	proxy.handleRequest(response, request)
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("got status %d, want upstream failure", response.Code)
	}
	if output.Len() == 0 {
		t.Fatal("missing proxy error diagnostic")
	}
	for _, secret := range []string{"secret-user", "secret-password", "secret-path", "secret-key", "secret-fragment"} {
		if strings.Contains(response.Body.String(), secret) {
			t.Errorf("returned credential-bearing URL component %q: %s", secret, response.Body.String())
		}
		if strings.Contains(output.String(), secret) {
			t.Errorf("logged credential-bearing URL component %q: %s", secret, output.String())
		}
	}
}

func TestProxyErrorLogsOmitNestedErrorMessages(t *testing.T) {
	output := captureProxyLogs(t)
	proxy := NewProxyServer(true)
	proxy.transport.DialContext = func(context.Context, string, string) (net.Conn, error) {
		return nil, &net.OpError{Op: "dial", Net: "tcp", Err: errors.New("secret-upstream-error")}
	}
	defer proxy.transport.CloseIdleConnections()
	request := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape("http://api.example/?token=secret-token"), nil)
	response := httptest.NewRecorder()
	proxy.handleRequest(response, request)
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("got status %d", response.Code)
	}
	if got := response.Body.String(); got != "network failure\n" {
		t.Errorf("got response %q", got)
	}
	if got := output.String(); got != "[Proxy Error:] network failure\n" {
		t.Errorf("got log %q", got)
	}
}

func TestProxyErrorLogsOmitRedirectURLs(t *testing.T) {
	output := captureProxyLogs(t)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Location", "http://%secret-invalid-host/path?api_key=secret-redirect-key")
		w.WriteHeader(http.StatusFound)
	}))
	defer upstream.Close()
	proxy := NewProxyServer(true)
	defer proxy.transport.CloseIdleConnections()
	request := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(upstream.URL), nil)
	response := httptest.NewRecorder()
	proxy.handleRequest(response, request)
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("got status %d", response.Code)
	}
	if got := response.Body.String(); got != "request failed\n" {
		t.Errorf("got response %q", got)
	}
	if got := output.String(); got != "[Proxy Error:] request failed\n" {
		t.Errorf("got log %q", got)
	}
}

func TestProxyErrorCategory(t *testing.T) {
	for _, tc := range []struct {
		name string
		err  error
		want string
	}{
		{"cancellation", context.Canceled, "request canceled"},
		{"deadline", context.DeadlineExceeded, "upstream timeout"},
		{"DNS timeout", &net.DNSError{Err: "secret", Name: "secret.example", IsTimeout: true}, "upstream timeout"},
		{"DNS failure", &net.DNSError{Err: "secret", Name: "secret.example"}, "DNS failure"},
		{"network failure", &net.OpError{Op: "dial", Net: "tcp", Err: errors.New("secret")}, "network failure"},
		{"other failure", errors.New("secret"), "request failed"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			wrapped := &url.Error{Op: "Get", URL: "https://secret.example/?token=secret", Err: tc.err}
			if got := proxyErrorCategory(wrapped); got != tc.want {
				t.Errorf("got %q, want %q", got, tc.want)
			}
		})
	}
}
