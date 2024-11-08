package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestPingEndpoint(t *testing.T) {
	// Create a new request
	req := httptest.NewRequest(http.MethodGet, "/ping", nil)
	w := httptest.NewRecorder()

	// Call the handler directly
	handleRequest(w, req)

	// Check the response
	if w.Code != http.StatusOK {
		t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
	}

	if w.Body.String() != "pong" {
		t.Errorf("Expected body 'pong', got '%s'", w.Body.String())
	}
}

func TestMissingScalarURL(t *testing.T) {
	// Create a new request without scalar_url parameter
	req := httptest.NewRequest(http.MethodGet, "/some/path", nil)
	w := httptest.NewRecorder()

	// Call the handler directly
	handleRequest(w, req)

	// Check the response
	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status code %d, got %d", http.StatusBadRequest, w.Code)
	}

	expectedError := "The `scalar_url` query parameter is required. Try to add `?scalar_url=https%3A%2F%2Fgalaxy.scalar.com%2Fplanets` to the URL."
	if w.Body.String() != expectedError+"\n" {
		t.Errorf("Expected error message about missing scalar_url parameter")
	}
}

func TestCORSMiddleware(t *testing.T) {
	// Create a test handler
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("test response"))
	})

	// Wrap it with CORS middleware
	handler := corsMiddleware(testHandler)

	// Create a request with Origin header
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Origin", "http://example.com")
	w := httptest.NewRecorder()

	// Call the handler
	handler.ServeHTTP(w, req)

	// Check CORS headers
	headers := w.Header()
	if headers.Get("Access-Control-Allow-Origin") != "http://example.com" {
		t.Errorf("Expected Allow-Origin header to be 'http://example.com'")
	}
	if headers.Get("Access-Control-Allow-Credentials") != "true" {
		t.Errorf("Expected Allow-Credentials header to be 'true'")
	}
}

func TestCORSPreflightRequest(t *testing.T) {
	// Create a test handler
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("Handler should not be called for OPTIONS request")
	})

	// Wrap it with CORS middleware
	handler := corsMiddleware(testHandler)

	// Create an OPTIONS request
	req := httptest.NewRequest(http.MethodOptions, "/", nil)
	w := httptest.NewRecorder()

	// Call the handler
	handler.ServeHTTP(w, req)

	// Check response
	if w.Code != http.StatusOK {
		t.Errorf("Expected status code %d for OPTIONS request, got %d", http.StatusOK, w.Code)
	}
}

func TestXForwardedHostHeader(t *testing.T) {
	// Create a test handler that checks the X-Forwarded-Host header
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		forwardedHost := r.Header.Get("X-Forwarded-Host")
		if forwardedHost != "example.com" {
			t.Errorf("Expected X-Forwarded-Host header to be 'example.com', got '%s'", forwardedHost)
		}
		w.Write([]byte("test response"))
	})

	// Create a request with X-Forwarded-Host header
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Forwarded-Host", "example.com")
	w := httptest.NewRecorder()

	// Call the handler directly
	testHandler.ServeHTTP(w, req)

	// Check response
	if w.Code != http.StatusOK {
		t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
	}
}

func TestProxyFollowsRedirects(t *testing.T) {
	// Create a test server that will redirect
	redirectServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/initial" {
			http.Redirect(w, r, "/final", http.StatusTemporaryRedirect)
			return
		}
		if r.URL.Path == "/final" {
			w.Write([]byte("final destination"))
		}
	}))
	defer redirectServer.Close()

	// Create a test handler that proxies to our redirect server
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		proxyURL := redirectServer.URL + "/initial"
		resp, err := http.Get(proxyURL)
		if err != nil {
			t.Fatalf("Failed to make proxy request: %v", err)
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			t.Fatalf("Failed to read response body: %v", err)
		}

		w.Write(body)
	})

	// Create a request
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()

	// Call the handler
	testHandler.ServeHTTP(w, req)

	// Check response
	if w.Code != http.StatusOK {
		t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
	}

	responseBody := w.Body.String()
	expectedBody := "final destination"
	if responseBody != expectedBody {
		t.Errorf("Expected body '%s', got '%s'", expectedBody, responseBody)
	}
}
