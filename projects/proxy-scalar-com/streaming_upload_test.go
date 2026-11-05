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
