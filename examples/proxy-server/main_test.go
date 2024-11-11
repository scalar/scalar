package main

import (
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

func TestLocationHeaderRewrite(t *testing.T) {
	// Create a test handler that returns a Location header with relative URL
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Location", "/foobar")
		w.WriteHeader(http.StatusFound)
	})

	// Create test server
	ts := httptest.NewServer(testHandler)
	defer ts.Close()

	// Create request with scalar_url parameter pointing to test server
	req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+ts.URL, nil)
	w := httptest.NewRecorder()

	// Call the main handler
	handleRequest(w, req)

	// Check that Location header was rewritten to include full URL
	location := w.Header().Get("Location")
	if location != ts.URL+"/foobar" {
		t.Errorf("Expected Location header to be '%s/foobar', got '%s'", ts.URL, location)
	}
}
