package main

import (
	"bufio"
	"fmt"
	"io"
	"net"
	"net/http"
	"testing"
	"time"
)

// Shorten configured limits without masking an absent production timeout.
func startIncomingServer(t *testing.T, handler http.Handler) string {
	t.Helper()
	server := newHTTPServer("127.0.0.1:0", handler)
	if server.ReadHeaderTimeout > 0 {
		server.ReadHeaderTimeout = 40 * time.Millisecond
	}
	if server.IdleTimeout > 0 {
		server.IdleTimeout = 40 * time.Millisecond
	}
	listener, err := net.Listen("tcp", server.Addr)
	if err != nil {
		t.Fatal(err)
	}
	done := make(chan error, 1)
	go func() { done <- server.Serve(listener) }()
	t.Cleanup(func() {
		server.Close()
		if err := <-done; err != http.ErrServerClosed {
			t.Errorf("server stopped: %v", err)
		}
	})
	return listener.Addr().String()
}

func dialIncomingServer(t *testing.T, address string) net.Conn {
	t.Helper()
	connection, err := net.DialTimeout("tcp", address, time.Second)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { connection.Close() })
	connection.SetDeadline(time.Now().Add(time.Second))
	return connection
}

func expectIncomingConnectionClosed(t *testing.T, connection net.Conn) {
	t.Helper()
	_, err := io.ReadAll(connection)
	if networkError, ok := err.(net.Error); ok && networkError.Timeout() {
		t.Fatal("incoming connection remained open until the test deadline")
	}
	if err != nil {
		t.Fatalf("read connection: %v", err)
	}
}

func TestIncomingHeaderTimeout(t *testing.T) {
	address := startIncomingServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handled an incomplete request")
	}))
	connection := dialIncomingServer(t, address)
	fmt.Fprint(connection, "GET /ping HTTP/1.1\r\nHost: proxy.example\r\nX-Slow: ")
	expectIncomingConnectionClosed(t, connection)
}

func TestIncomingIdleTimeout(t *testing.T) {
	address := startIncomingServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		io.WriteString(w, "pong")
	}))
	connection := dialIncomingServer(t, address)
	fmt.Fprint(connection, "GET /ping HTTP/1.1\r\nHost: proxy.example\r\n\r\n")
	response, err := http.ReadResponse(bufio.NewReader(connection), nil)
	if err != nil {
		t.Fatal(err)
	}
	body, err := io.ReadAll(response.Body)
	response.Body.Close()
	if err != nil || response.StatusCode != http.StatusOK || string(body) != "pong" {
		t.Fatalf("unexpected response: status=%d body=%q error=%v", response.StatusCode, body, err)
	}
	expectIncomingConnectionClosed(t, connection)
}

func TestIncomingTimeoutsPreserveActiveStreams(t *testing.T) {
	address := startIncomingServer(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(r.Body)
		if err != nil || string(body) != "upload" {
			t.Errorf("upload interrupted: %q %v", body, err)
		}
		w.Header().Set("Content-Type", "text/event-stream")
		io.WriteString(w, "data: first\n\n")
		w.(http.Flusher).Flush()
		time.Sleep(120 * time.Millisecond)
		io.WriteString(w, "data: second\n\n")
	}))
	connection := dialIncomingServer(t, address)
	fmt.Fprint(connection, "POST /stream HTTP/1.1\r\nHost: proxy.example\r\nContent-Length: 6\r\nConnection: close\r\n\r\nu")
	time.Sleep(120 * time.Millisecond)
	fmt.Fprint(connection, "pload")
	response, err := http.ReadResponse(bufio.NewReader(connection), nil)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	reader := bufio.NewReader(response.Body)
	first, err := reader.ReadString('\n')
	if err != nil || first != "data: first\n" {
		t.Fatalf("first event: %q %v", first, err)
	}
	rest, err := io.ReadAll(reader)
	if err != nil || string(rest) != "\ndata: second\n\n" {
		t.Fatalf("stream interrupted: %q %v", rest, err)
	}
}
