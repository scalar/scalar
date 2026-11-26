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
	"testing"
	"time"
)

func TestStreamsBeforeUploadEOF(t *testing.T) {
	proxy := NewProxyServer(true)
	arrived := make(chan struct{})
	proxy.transport = &http.Transport{DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
		client, server := net.Pipe()
		go func() {
			defer server.Close()
			req, err := http.ReadRequest(bufio.NewReader(server))
			if err != nil {
				return
			}
			b := make([]byte, 1)
			if _, err := io.ReadFull(req.Body, b); err != nil {
				return
			}
			close(arrived)
			io.Copy(io.Discard, req.Body)
			fmt.Fprint(server, "HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nOK")
		}()
		return client, nil
	}}
	defer proxy.transport.CloseIdleConnections()
	reader, writer := io.Pipe()
	defer reader.Close()
	defer writer.Close()
	req := httptest.NewRequest("POST", "/", reader)
	remote, _ := url.Parse("http://api.example/upload")
	response := httptest.NewRecorder()
	done := make(chan error, 1)
	go func() { done <- proxy.executeProxyRequest(response, req, remote, remote.String()) }()
	if _, err := writer.Write([]byte("first upload chunk")); err != nil {
		t.Fatal(err)
	}
	streamed := false
	select {
	case <-arrived:
		streamed = true
	case <-time.After(5 * time.Second):
	}
	writer.Close()
	if err := <-done; err != nil {
		t.Fatal(err)
	}
	if !streamed {
		t.Fatal("upstream received no data until upload EOF; streaming regressed")
	}
}

// An upstream can reject a request or redirect it before consuming the upload.
// Returning that response must not wait for EOF or replay an incomplete body.
func TestEarlyUploadResponse(t *testing.T) {
	for _, status := range []int{http.StatusRequestEntityTooLarge, http.StatusTemporaryRedirect, http.StatusPermanentRedirect} {
		t.Run(fmt.Sprint(status), func(t *testing.T) {
			proxy := NewProxyServer(true)
			proxy.transport = &http.Transport{DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
				client, server := net.Pipe()
				go func() {
					defer server.Close()
					req, err := http.ReadRequest(bufio.NewReader(server))
					if err != nil {
						return
					}
					if req.URL.Path != "/upload" {
						t.Error("replayed an incomplete upload")
						return
					}
					if _, err := io.ReadFull(req.Body, make([]byte, 1)); err != nil {
						return
					}
					fmt.Fprintf(server, "HTTP/1.1 %d Response\r\nLocation: /final\r\nContent-Length: 0\r\nConnection: close\r\n\r\n", status)
				}()
				return client, nil
			}}
			defer proxy.transport.CloseIdleConnections()
			reader, writer := io.Pipe()
			defer reader.Close()
			defer writer.Close()
			request := httptest.NewRequest(http.MethodPost, "/", reader)
			remote, _ := url.Parse("http://api.example/upload")
			response := httptest.NewRecorder()
			done := make(chan error, 1)
			go func() { done <- proxy.executeProxyRequest(response, request, remote, remote.String()) }()
			if _, err := writer.Write([]byte("first chunk")); err != nil {
				t.Fatal(err)
			}
			select {
			case err := <-done:
				if err != nil {
					t.Fatal(err)
				}
			case <-time.After(5 * time.Second):
				writer.Close()
				<-done
				t.Fatal("response waited for upload EOF")
			}
			if response.Code != status {
				t.Fatalf("got status %d, want %d", response.Code, status)
			}
			if status == http.StatusTemporaryRedirect || status == http.StatusPermanentRedirect {
				if response.Header().Get("Location") != "" || response.Header().Get("X-Scalar-Original-Location") != "http://api.example/final" {
					t.Fatalf("unsafe or missing redirect headers: %v", response.Header())
				}
			}
			if held := proxy.bufferedBodyBytes.Load(); held != 0 {
				t.Fatalf("retained %d bytes after early response", held)
			}
		})
	}
}

// Use a real inbound HTTP/1 body: unlike io.Pipe, its Close can block behind
// an ongoing Read, and the server normally drains it before sending a response.
func TestHTTP1EarlyUploadResponse(t *testing.T) {
	for _, status := range []int{http.StatusRequestEntityTooLarge, http.StatusTemporaryRedirect, http.StatusPermanentRedirect} {
		t.Run(fmt.Sprint(status), func(t *testing.T) {
			upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				_ = http.NewResponseController(w).EnableFullDuplex()
				if r.URL.Path != "/upload" {
					t.Error("replayed an incomplete upload")
					w.WriteHeader(http.StatusInternalServerError)
					return
				}
				if _, err := io.ReadFull(r.Body, make([]byte, 1)); err != nil {
					return
				}
				w.Header().Set("Connection", "close")
				w.Header().Set("Location", "/final")
				w.WriteHeader(status)
				w.Write([]byte("early"))
			}))
			defer upstream.Close()
			proxy := NewProxyServer(true)
			server := httptest.NewServer(corsMiddleware(http.HandlerFunc(proxy.handleRequest)))
			defer server.Close()
			defer proxy.transport.CloseIdleConnections()
			conn, err := net.Dial("tcp", strings.TrimPrefix(server.URL, "http://"))
			if err != nil {
				t.Fatal(err)
			}
			defer conn.Close()
			// Send a chunk, but deliberately omit the terminating zero chunk.
			fmt.Fprintf(conn, "POST /?scalar_url=%s HTTP/1.1\r\nHost: proxy\r\nTransfer-Encoding: chunked\r\n\r\n1\r\na\r\n", url.QueryEscape(upstream.URL+"/upload"))
			conn.SetReadDeadline(time.Now().Add(5 * time.Second))
			response, err := http.ReadResponse(bufio.NewReader(conn), nil)
			if err != nil {
				t.Fatalf("early response blocked: %v", err)
			}
			defer response.Body.Close()
			if response.StatusCode != status {
				t.Fatalf("got status %d, want %d", response.StatusCode, status)
			}
			body, err := io.ReadAll(response.Body)
			if err != nil || string(body) != "early" {
				t.Fatalf("early body = %q, error = %v", body, err)
			}
			if response.Header.Get("Access-Control-Allow-Origin") != "*" {
				t.Fatal("early response lost CORS headers")
			}
			if status != http.StatusRequestEntityTooLarge && response.Header.Get("Location") != "" {
				t.Fatal("early redirect exposes a browser-followable Location")
			}
		})
	}
}
