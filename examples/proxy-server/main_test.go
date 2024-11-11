package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

// Common test setup
type proxyTestServer struct {
	server *httptest.Server
	url    string
}

func setupTestServer(handler http.HandlerFunc) *proxyTestServer {
	server := httptest.NewServer(handler)
	return &proxyTestServer{
		server: server,
		url:    server.URL,
	}
}

func TestBasicEndpoints(t *testing.T) {
	proxyServer := NewProxyServer()

	t.Run("Ping returns pong", func(t *testing.T) {
		// Create a new request
		req := httptest.NewRequest(http.MethodGet, "/ping", nil)
		w := httptest.NewRecorder()

		// Call the handler directly
		proxyServer.handleRequest(w, req)

		// Check the response
		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}

		if w.Body.String() != "pong" {
			t.Errorf("Expected body 'pong', got '%s'", w.Body.String())
		}
	})

	t.Run("Returns error when scalar_url is missing", func(t *testing.T) {
		// Create a new request without scalar_url parameter
		req := httptest.NewRequest(http.MethodGet, "/some/path", nil)
		w := httptest.NewRecorder()

		// Call the handler directly
		proxyServer.handleRequest(w, req)

		// Check the response
		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status code %d, got %d", http.StatusBadRequest, w.Code)
		}

		expectedError := "The `scalar_url` query parameter is required. Try to add `?scalar_url=https%3A%2F%2Fgalaxy.scalar.com%2Fplanets` to the URL."
		if w.Body.String() != expectedError+"\n" {
			t.Errorf("Expected error message about missing scalar_url parameter")
		}
	})
}

func TestCORSHandling(t *testing.T) {
	proxyServer := NewProxyServer()

	t.Run("Adds CORS headers to normal requests", func(t *testing.T) {
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
	})

	t.Run("Handles preflight OPTIONS requests", func(t *testing.T) {
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
	})

	t.Run("Preserves CORS headers from origin", func(t *testing.T) {
		// Create a test server that sends CORS headers
		targetServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "https://original-allowed-origin.com")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Write([]byte("response with CORS"))
		}))
		defer targetServer.Close()

		// Create a request with scalar_url pointing to our test server
		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+targetServer.URL, nil)
		req.Header.Set("Origin", "http://example.com")
		w := httptest.NewRecorder()

		// Call the handler
		proxyServer.handleRequest(w, req)

		// Check response
		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}

		// Verify that our proxy's CORS headers override the target's headers
		headers := w.Header()

		if headers.Get("Access-Control-Allow-Origin") != "http://example.com" {
			t.Errorf("Expected Access-Control-Allow-Origin header to be 'http://example.com', got '%s'",
				headers.Get("Access-Control-Allow-Origin"))
		}

		if headers.Get("Access-Control-Allow-Headers") != "*" {
			t.Errorf("Expected Access-Control-Allow-Headers header to be '*', got '%s'",
				headers.Get("Access-Control-Allow-Headers"))
		}

		if headers.Get("Access-Control-Allow-Methods") != "POST, GET, OPTIONS, PUT, DELETE, PATCH" {
			t.Errorf("Expected Access-Control-Allow-Methods header to be 'POST, GET, OPTIONS, PUT, DELETE, PATCH', got '%s'",
				headers.Get("Access-Control-Allow-Methods"))
		}

		if headers.Get("Access-Control-Allow-Credentials") != "true" {
			t.Errorf("Expected Access-Control-Allow-Credentials header to be 'true', got '%s'",
				headers.Get("Access-Control-Allow-Credentials"))
		}

		if headers.Get("Access-Control-Expose-Headers") != "*" {
			t.Errorf("Expected Access-Control-Expose-Headers header to be '*', got '%s'",
				headers.Get("Access-Control-Expose-Headers"))
		}
	})
}

func TestProxyBehavior(t *testing.T) {
	proxyServer := NewProxyServer()

	t.Run("Follows redirects correctly", func(t *testing.T) {
		server := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/initial" {
				http.Redirect(w, r, "/final", http.StatusTemporaryRedirect)
				return
			}
			if r.URL.Path == "/final" {
				w.Write([]byte("final destination"))
			}
		})
		defer server.server.Close()

		// Create a test handler that proxies to our redirect server
		testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			proxyURL := server.url + "/initial"
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
	})

	t.Run("Overwrites CORS headers after redirects", func(t *testing.T) {
		server := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/initial" {
				w.Header().Set("Access-Control-Allow-Origin", "https://original-allowed-origin.com")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
				http.Redirect(w, r, "/final", http.StatusTemporaryRedirect)
				return
			}

			if r.URL.Path == "/final" {
				w.Header().Set("Access-Control-Allow-Origin", "https://original-allowed-origin.com")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
				w.Write([]byte("final destination"))
			}
		})
		defer server.server.Close()

		// Create a request with scalar_url pointing to our test server's initial path
		// Ensure the URL ends with exactly /initial
		targetURL := server.url + "/initial"
		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+targetURL, nil)
		w := httptest.NewRecorder()

		// Call the handler
		proxyServer.handleRequest(w, req)

		// Check response
		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}

		// Verify that CORS headers are overwritten after redirect
		headers := w.Header()
		expectedOrigin := "*"
		if headers.Get("Access-Control-Allow-Origin") != expectedOrigin {
			t.Errorf("Expected Access-Control-Allow-Origin header to be '%s', got '%s'",
				expectedOrigin, headers.Get("Access-Control-Allow-Origin"))
		}

		expectedMethods := "POST, GET, OPTIONS, PUT, DELETE, PATCH"
		if headers.Get("Access-Control-Allow-Methods") != expectedMethods {
			t.Errorf("Expected Access-Control-Allow-Methods header to be '%s', got '%s'",
				expectedMethods, headers.Get("Access-Control-Allow-Methods"))
		}

		// Verify we got the final response body
		expectedBody := "final destination"
		if w.Body.String() != expectedBody {
			t.Errorf("Expected body '%s', got '%s'", expectedBody, w.Body.String())
		}
	})

	t.Run("Handles network errors gracefully", func(t *testing.T) {
		// Test with an invalid URL to trigger network error
		req := httptest.NewRequest(http.MethodGet, "/?scalar_url=http://invalid.localhost:99999", nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if w.Code != http.StatusServiceUnavailable {
			t.Errorf("Expected status code %d, got %d", http.StatusServiceUnavailable, w.Code)
		}
	})

	t.Run("Copies non-CORS headers from response", func(t *testing.T) {
		server := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("X-Custom-Header", "custom-value")
			w.Header().Set("Access-Control-Allow-Origin", "https://should-be-removed.com")
			w.Write([]byte("response"))
		})
		defer server.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+server.url, nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if w.Header().Get("X-Custom-Header") != "custom-value" {
			t.Errorf("Expected X-Custom-Header to be 'custom-value', got '%s'",
				w.Header().Get("X-Custom-Header"))
		}
		if w.Header().Get("Access-Control-Allow-Origin") == "https://should-be-removed.com" {
			t.Error("Original CORS header should have been removed")
		}
	})

	t.Run("Handles invalid request creation", func(t *testing.T) {
		// Test with an invalid URL to trigger NewRequest error
		req := httptest.NewRequest(http.MethodGet, "/?scalar_url=:", nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if w.Code != http.StatusServiceUnavailable {
			t.Errorf("Expected status code %d, got %d", http.StatusServiceUnavailable, w.Code)
		}
	})

	t.Run("Sends the correct X-Forwarded-Host header when following redirects", func(t *testing.T) {
		// Create a test server that redirects and returns a response
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/initial" {
				http.Redirect(w, r, "/final", http.StatusTemporaryRedirect)
				return
			}
			if r.URL.Path == "/final" {
				w.Write([]byte("final destination"))
			}
		})
		defer targetServer.server.Close()

		// Create a request to the proxy with scalar_url pointing to initial path
		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+targetServer.url+"/initial", nil)
		req.Host = "proxy-host.com"  // Set the original host
		w := httptest.NewRecorder()

		// Call the proxy handler
		proxyServer.handleRequest(w, req)

		// Check response
		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}

		if w.Body.String() != "final destination" {
			t.Errorf("Expected X-Forwarded-Host header to be 'final destination', got '%s'", w.Body.String())
		}


		// Check if X-Forwarded-Host header contains the final URL
		expectedFinalURL := targetServer.url + "/final"
		actualForwardedHost := w.Header().Get("X-Forwarded-Host")
		if actualForwardedHost != expectedFinalURL {
			t.Errorf("Expected X-Forwarded-Host header to be '%s', got '%s'", expectedFinalURL, actualForwardedHost)
		}
	})
}
