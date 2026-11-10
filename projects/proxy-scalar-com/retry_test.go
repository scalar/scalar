package main

import (
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
)

// Fail the next pooled write before any bytes reach the API.
type failedWriteConn struct {
	net.Conn
	fail *atomic.Bool
}

func (c failedWriteConn) Write(p []byte) (int, error) {
	if c.fail.Load() {
		return 0, fmt.Errorf("connection reset")
	}
	return c.Conn.Write(p)
}

func TestRetryCompletedUpload(t *testing.T) {
	for _, complete := range []bool{true, false} {
		t.Run(fmt.Sprint(complete), func(t *testing.T) {
			var received atomic.Int32
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Method == http.MethodPost {
					body, _ := io.ReadAll(r.Body)
					if string(body) != "payload" {
						t.Errorf("unexpected replay: %q", body)
					}
					received.Add(1)
				}
				fmt.Fprint(w, "OK")
			}))
			defer server.Close()
			var fail atomic.Bool
			var dials atomic.Int32
			transport := &http.Transport{DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
				conn, err := (&net.Dialer{}).DialContext(ctx, network, addr)
				if err == nil && dials.Add(1) == 1 {
					return failedWriteConn{conn, &fail}, nil
				}
				return conn, err
			}}
			defer transport.CloseIdleConnections()
			client := &http.Client{Transport: redirectReplayTransport{transport}}
			response, err := client.Get(server.URL)
			if err != nil {
				t.Fatal(err)
			}
			io.Copy(io.Discard, response.Body)
			response.Body.Close()
			fail.Store(true)
			proxy := NewProxyServer(true)
			body, release := proxy.replayableBody(io.NopCloser(strings.NewReader("payload")), 7)
			defer release()
			if complete {
				io.Copy(io.Discard, body)
			}
			request, _ := http.NewRequest(http.MethodPost, server.URL, strings.NewReader("payload"))
			request.GetBody = body.getBody
			response, err = client.Do(request)
			if complete {
				if err != nil {
					t.Fatal(err)
				}
				io.Copy(io.Discard, response.Body)
				response.Body.Close()
				if received.Load() != 1 {
					t.Fatalf("expected one replay, got %d", received.Load())
				}
			} else {
				if err == nil {
					response.Body.Close()
					t.Fatal("incomplete upload was retried")
				}
				if received.Load() != 0 {
					t.Fatal("incomplete body reached upstream")
				}
			}
		})
	}
}
