package main

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"
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
	proxyServer := NewProxyServer(true)

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

	t.Run("Root path serves HTML", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}

		if contentType := w.Header().Get("Content-Type"); contentType != "text/html" {
			t.Errorf("Expected Content-Type 'text/html', got '%s'", contentType)
		}

		if len(w.Body.String()) == 0 {
			t.Error("Expected non-empty HTML response")
		}
	})

	t.Run("OpenAPI document is served", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/openapi.yaml", nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}

		if contentType := w.Header().Get("Content-Type"); contentType != "text/yaml" {
			t.Errorf("Expected Content-Type 'text/yaml', got '%s'", contentType)
		}

		if len(w.Body.String()) == 0 {
			t.Error("Expected non-empty YAML response")
		}

		if !strings.Contains(w.Body.String(), "version: __COMMIT_SHA__") {
			t.Error("Expected OpenAPI document to contain the commit SHA placeholder")
		}
	})

	t.Run("Root path with query params requires scalar_url", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/?something=value", nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status code %d, got %d", http.StatusBadRequest, w.Code)
		}

		expectedError := scalarURLValidationErrors[0].message
		if w.Body.String() != expectedError+"\n" {
			t.Errorf("Expected error message about missing scalar_url parameter")
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

		expectedError := scalarURLValidationErrors[0].message
		if w.Body.String() != expectedError+"\n" {
			t.Errorf("Expected error message about missing scalar_url parameter")
		}
	})

	t.Run("Returns a descriptive error when scalar_url is relative", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/?scalar_url=/foobar", nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status code %d, got %d", http.StatusBadRequest, w.Code)
		}

		expectedError := scalarURLValidationErrors[1].message
		if w.Body.String() != expectedError+"\n" {
			t.Errorf("Expected relative URL validation error message")
		}
	})
}

func TestCORSHandling(t *testing.T) {
	proxyServer := NewProxyServer(true)

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
		if headers.Get("Access-Control-Allow-Origin") != "*" {
			t.Errorf("Expected Allow-Origin header to be '*'")
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
			w.Header().Set("Access-Control-Allow-Origin", "*")
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

		if headers.Get("Access-Control-Allow-Origin") != "*" {
			t.Errorf("Expected Access-Control-Allow-Origin header to be '*', got '%s'",
				headers.Get("Access-Control-Allow-Origin"))
		}

		if headers.Get("Access-Control-Allow-Headers") != "*" {
			t.Errorf("Expected Access-Control-Allow-Headers header to be '*', got '%s'",
				headers.Get("Access-Control-Allow-Headers"))
		}

		if headers.Get("Access-Control-Allow-Methods") != "POST, GET, OPTIONS, PUT, DELETE, PATCH, QUERY" {
			t.Errorf("Expected Access-Control-Allow-Methods header to be 'POST, GET, OPTIONS, PUT, DELETE, PATCH, QUERY', got '%s'",
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
	proxyServer := NewProxyServer(true)

	t.Run("Allows QUERY preflight and forwards the request body", func(t *testing.T) {
		const body = `{"name":"Earth","habitable":true}`
		calls := 0
		target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			calls++
			if r.Method != "QUERY" {
				t.Errorf("Expected QUERY method, got %s", r.Method)
			}
			if r.Header.Get("Content-Type") != "application/json" {
				t.Errorf("Expected JSON content type, got %s", r.Header.Get("Content-Type"))
			}
			data, err := io.ReadAll(r.Body)
			if err != nil || string(data) != body {
				t.Errorf("Expected body %s, got %s (error: %v)", body, data, err)
			}
			w.Write(data)
		}))
		defer target.Close()

		handler := corsMiddleware(http.HandlerFunc(proxyServer.handleRequest))
		path := "/?scalar_url=" + url.QueryEscape(target.URL)
		preflight := httptest.NewRequest(http.MethodOptions, path, nil)
		preflight.Header.Set("Origin", "http://example.com")
		preflight.Header.Set("Access-Control-Request-Method", "QUERY")
		preflight.Header.Set("Access-Control-Request-Headers", "content-type")
		preflightResponse := httptest.NewRecorder()
		handler.ServeHTTP(preflightResponse, preflight)
		if preflightResponse.Code != http.StatusOK {
			t.Fatalf("Expected successful preflight, got %d", preflightResponse.Code)
		}
		if !strings.Contains(preflightResponse.Header().Get("Access-Control-Allow-Methods"), "QUERY") {
			t.Fatal("Expected preflight to allow QUERY")
		}
		if calls != 0 {
			t.Fatal("Preflight must not reach the upstream server")
		}

		req := httptest.NewRequest("QUERY", path, strings.NewReader(body))
		req.Header.Set("Origin", "http://example.com")
		req.Header.Set("Content-Type", "application/json")
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, req)
		if response.Code != http.StatusOK || response.Body.String() != body {
			t.Errorf("Expected successful echoed response, got %d: %s", response.Code, response.Body.String())
		}
		if calls != 1 {
			t.Errorf("Expected one upstream request, got %d", calls)
		}
		if !strings.Contains(response.Header().Get("Access-Control-Allow-Methods"), "QUERY") {
			t.Error("Expected response to allow QUERY")
		}
	})

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
				w.Header().Set("Access-Control-Allow-Origin", "*")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
				http.Redirect(w, r, "/final", http.StatusTemporaryRedirect)
				return
			}

			if r.URL.Path == "/final" {
				w.Header().Set("Access-Control-Allow-Origin", "*")
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

		expectedMethods := "POST, GET, OPTIONS, PUT, DELETE, PATCH, QUERY"
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

	t.Run("Keeps credential headers on same-host redirect", func(t *testing.T) {
		gotAuth := ""
		server := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path == "/initial" {
				http.Redirect(w, r, "/final", http.StatusTemporaryRedirect)
				return
			}
			gotAuth = r.Header.Get("Authorization")
			w.Write([]byte("final destination"))
		})
		defer server.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+server.url+"/initial", nil)
		req.Header.Set("Authorization", "Bearer secret-token")
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}

		if gotAuth != "Bearer secret-token" {
			t.Errorf("Expected Authorization to be forwarded on same-host redirect, got '%s'", gotAuth)
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

	t.Run("Handles scalar_url set to proxy root without looping", func(t *testing.T) {
		selfProxyServer := httptest.NewServer(http.HandlerFunc(proxyServer.handleRequest))
		defer selfProxyServer.Close()

		client := &http.Client{Timeout: 2 * time.Second}
		proxyRequestURL := selfProxyServer.URL + "/?scalar_url=" + url.QueryEscape(selfProxyServer.URL)
		resp, err := client.Get(proxyRequestURL)

		if err != nil {
			t.Fatalf("Expected request to complete without loop, got error: %v", err)
		}

		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			t.Fatalf("Failed to read response body: %v", err)
		}

		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, resp.StatusCode)
		}

		if len(body) == 0 {
			t.Error("Expected non-empty response body")
		}
	})

	t.Run("Stops nested scalar_url chain pointing back to proxy", func(t *testing.T) {
		selfProxyServer := httptest.NewServer(http.HandlerFunc(proxyServer.handleRequest))
		defer selfProxyServer.Close()

		nestedTarget := selfProxyServer.URL
		for range 3 {
			nestedTarget = selfProxyServer.URL + "/?scalar_url=" + url.QueryEscape(nestedTarget)
		}

		client := &http.Client{Timeout: 2 * time.Second}
		proxyRequestURL := selfProxyServer.URL + "/?scalar_url=" + url.QueryEscape(nestedTarget)
		resp, err := client.Get(proxyRequestURL)

		if err != nil {
			t.Fatalf("Expected nested request chain to complete without loop, got error: %v", err)
		}

		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			t.Fatalf("Failed to read response body: %v", err)
		}

		if resp.StatusCode != http.StatusLoopDetected {
			t.Errorf("Expected status code %d, got %d", http.StatusLoopDetected, resp.StatusCode)
		}

		if !strings.Contains(string(body), proxyLoopError) {
			t.Errorf("Expected the loop error, got %q", string(body))
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
		req.Host = "proxy-host.com" // Set the original host
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

	t.Run("Removes Origin header from outbound request", func(t *testing.T) {
		// Create a test server that echoes back the received headers
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			// Check if Origin header exists in the proxied request
			if origin := r.Header.Get("Origin"); origin != "" {
				t.Errorf("Origin header should have been removed, but got: %s", origin)
			}

			w.Write([]byte("success"))
		})
		defer targetServer.server.Close()

		// Create a request with Origin header
		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+targetServer.url, nil)
		req.Header.Set("Origin", "http://example.com")
		w := httptest.NewRecorder()

		// Call the handler
		proxyServer.handleRequest(w, req)

		// Check response
		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
	})

	t.Run("Does not forward any cookies by default", func(t *testing.T) {
		// Create a test server that checks for the Cookie header
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			// Check that Cookie header is omitted completely rather than sent as empty value
			if _, exists := r.Header["Cookie"]; exists {
				t.Errorf("Expected Cookie header to be omitted, but was present: %v", r.Header["Cookie"])
			}
			w.Write([]byte("success"))
		})
		defer targetServer.server.Close()

		// Create a request with a cookie header
		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+targetServer.url, nil)
		req.Header.Set("Cookie", "sensitive_session_id=abc123")
		w := httptest.NewRecorder()

		// Call the handler
		proxyServer.handleRequest(w, req)

		// Check response
		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
	})

	t.Run("Forwards X-Scalar-Cookie as Cookie header", func(t *testing.T) {
		// Create a test server that checks for the Cookie header
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			// Check that Cookie header is set
			expectedCookie := "session_id=abc123"
			if cookie := r.Header.Get("Cookie"); cookie != expectedCookie {
				t.Errorf("Expected Cookie header to be '%s', got '%s'", expectedCookie, cookie)
			}
			// Check that X-Scalar-Cookie header is removed
			if xScalarCookie := r.Header.Get("X-Scalar-Cookie"); xScalarCookie != "" {
				t.Errorf("X-Scalar-Cookie header should have been removed, but got: %s", xScalarCookie)
			}
			w.Write([]byte("success"))
		})
		defer targetServer.server.Close()

		// Create a request with X-Scalar-Cookie header
		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+targetServer.url, nil)
		req.Header.Set("X-Scalar-Cookie", "session_id=abc123")
		w := httptest.NewRecorder()

		// Call the handler
		proxyServer.handleRequest(w, req)

		// Check response
		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
	})

	t.Run("Omits Cookie header completely when X-Scalar-Cookie is empty string", func(t *testing.T) {
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			if _, exists := r.Header["Cookie"]; exists {
				t.Errorf("Expected Cookie header to be omitted, but got: %v", r.Header["Cookie"])
			}
			w.Write([]byte("success"))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+targetServer.url, nil)
		req.Header.Set("X-Scalar-Cookie", "")
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
	})

	t.Run("Mirrors a single Set-Cookie into X-Scalar-Set-Cookie", func(t *testing.T) {
		// Create a test server that sets a cookie on the response
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Set-Cookie", "csrftoken=abc123; Path=/; SameSite=Lax")
			w.Write([]byte("success"))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+targetServer.url, nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		// Set-Cookie is mirrored into the custom header the browser client can
		// actually read. The original is not forwarded, so it cannot set cookies on
		// the proxy origin.
		expected := "csrftoken=abc123; Path=/; SameSite=Lax"
		if got := w.Header().Get("X-Scalar-Set-Cookie"); got != expected {
			t.Errorf("Expected X-Scalar-Set-Cookie header to be '%s', got '%s'", expected, got)
		}
	})

	t.Run("Mirrors multiple Set-Cookie values into X-Scalar-Set-Cookie", func(t *testing.T) {
		// Create a test server that sets two cookies on the response
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Add("Set-Cookie", "csrftoken=abc123; Path=/")
			w.Header().Add("Set-Cookie", "sessionid=xyz789; Path=/; HttpOnly")
			w.Write([]byte("success"))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+targetServer.url, nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		// Multiple cookies are joined with ", ", matching the desktop app.
		expected := "csrftoken=abc123; Path=/, sessionid=xyz789; Path=/; HttpOnly"
		if got := w.Header().Get("X-Scalar-Set-Cookie"); got != expected {
			t.Errorf("Expected X-Scalar-Set-Cookie header to be '%s', got '%s'", expected, got)
		}
	})

	t.Run("Omits X-Scalar-Set-Cookie when there is no Set-Cookie", func(t *testing.T) {
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("success"))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+targetServer.url, nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if got := w.Header().Get("X-Scalar-Set-Cookie"); got != "" {
			t.Errorf("Expected no X-Scalar-Set-Cookie header, got '%s'", got)
		}
	})

	t.Run("Forwards X-Scalar-Date as Date header", func(t *testing.T) {
		// Create a test server that checks for the Date header
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			expectedDate := "Wed, 21 Oct 2015 07:28:00 GMT"
			if date := r.Header.Get("Date"); date != expectedDate {
				t.Errorf("Expected Date header to be '%s', got '%s'", expectedDate, date)
			}
			// Check that X-Scalar-Date header is removed
			if xScalarDate := r.Header.Get("X-Scalar-Date"); xScalarDate != "" {
				t.Errorf("X-Scalar-Date header should have been removed, but got: %s", xScalarDate)
			}
			w.Write([]byte("success"))
		})
		defer targetServer.server.Close()

		// Create a request with X-Scalar-Date header
		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+targetServer.url, nil)
		req.Header.Set("X-Scalar-Date", "Wed, 21 Oct 2015 07:28:00 GMT")
		w := httptest.NewRecorder()

		// Call the handler
		proxyServer.handleRequest(w, req)

		// Check response
		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
	})

	t.Run("Forwards X-Scalar-User-Agent as User-Agent header", func(t *testing.T) {
		// Create a test server that checks for the User-Agent header
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			expectedUserAgent := "ScalarTest/1.0"
			if userAgent := r.Header.Get("User-Agent"); userAgent != expectedUserAgent {
				t.Errorf("Expected User-Agent header to be '%s', got '%s'", expectedUserAgent, userAgent)
			}
			// Check that X-Scalar-User-Agent header is removed
			if xScalarUserAgent := r.Header.Get("X-Scalar-User-Agent"); xScalarUserAgent != "" {
				t.Errorf("X-Scalar-User-Agent header should have been removed, but got: %s", xScalarUserAgent)
			}
			w.Write([]byte("success"))
		})
		defer targetServer.server.Close()

		// Create a request with X-Scalar-User-Agent header
		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+targetServer.url, nil)
		req.Header.Set("X-Scalar-User-Agent", "ScalarTest/1.0")
		w := httptest.NewRecorder()

		// Call the handler
		proxyServer.handleRequest(w, req)

		// Check response
		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
	})

	t.Run("Forwards X-Scalar-DNT and X-Scalar-Referer as request headers", func(t *testing.T) {
		// Create a test server that checks for forwarded headers
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			if dnt := r.Header.Get("DNT"); dnt != "1" {
				t.Errorf("Expected DNT header to be '1', got '%s'", dnt)
			}
			if referer := r.Header.Get("Referer"); referer != "https://app.scalar.com/request" {
				t.Errorf("Expected Referer header to be 'https://app.scalar.com/request', got '%s'", referer)
			}
			// Check that X-Scalar-* headers are removed
			if xScalarDNT := r.Header.Get("X-Scalar-DNT"); xScalarDNT != "" {
				t.Errorf("X-Scalar-DNT header should have been removed, but got: %s", xScalarDNT)
			}
			if xScalarReferer := r.Header.Get("X-Scalar-Referer"); xScalarReferer != "" {
				t.Errorf("X-Scalar-Referer header should have been removed, but got: %s", xScalarReferer)
			}
			w.Write([]byte("success"))
		})
		defer targetServer.server.Close()

		// Create a request with X-Scalar-DNT and X-Scalar-Referer headers
		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+targetServer.url, nil)
		req.Header.Set("X-Scalar-DNT", "1")
		req.Header.Set("X-Scalar-Referer", "https://app.scalar.com/request")
		w := httptest.NewRecorder()

		// Call the handler
		proxyServer.handleRequest(w, req)

		// Check response
		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
	})
}

func readSSEEvent(reader *bufio.Reader) (string, error) {
	lines := []string{}

	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			return "", err
		}

		if line == "\n" {
			return strings.Join(lines, ""), nil
		}

		lines = append(lines, line)
	}
}

func TestSSEStreaming(t *testing.T) {
	proxyServer := NewProxyServer(true)
	const eventInterval = 350 * time.Millisecond

	targetServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")

		flusher, ok := w.(http.Flusher)
		if !ok {
			t.Fatal("expected SSE handler response writer to support flushing")
		}

		for i := range 2 {
			fmt.Fprintf(w, "data: event-%d\n\n", i+1)
			flusher.Flush()
			time.Sleep(eventInterval)
		}
	}))
	defer targetServer.Close()

	proxy := httptest.NewServer(corsMiddleware(http.HandlerFunc(proxyServer.handleRequest)))
	defer proxy.Close()

	resp, err := http.Get(proxy.URL + "/?scalar_url=" + url.QueryEscape(targetServer.URL))
	if err != nil {
		t.Fatalf("Expected proxy request to succeed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected status code %d, got %d", http.StatusOK, resp.StatusCode)
	}

	reader := bufio.NewReader(resp.Body)

	firstStart := time.Now()
	firstEvent, err := readSSEEvent(reader)
	firstDuration := time.Since(firstStart)
	if err != nil {
		t.Fatalf("Expected first SSE event to be readable: %v", err)
	}

	if firstEvent != "data: event-1\n" {
		t.Fatalf("Expected first SSE event to be %q, got %q", "data: event-1\n", firstEvent)
	}

	if firstDuration > 250*time.Millisecond {
		t.Fatalf("Expected first SSE event to arrive quickly, took %s", firstDuration)
	}

	secondStart := time.Now()
	secondEvent, err := readSSEEvent(reader)
	secondDuration := time.Since(secondStart)
	if err != nil {
		t.Fatalf("Expected second SSE event to be readable: %v", err)
	}

	if secondEvent != "data: event-2\n" {
		t.Fatalf("Expected second SSE event to be %q, got %q", "data: event-2\n", secondEvent)
	}

	if secondDuration < 200*time.Millisecond {
		t.Fatalf("Expected second SSE event to arrive after stream delay, took %s", secondDuration)
	}
}

func TestCidrPolicy(t *testing.T) {
	proxyServer := NewProxyServer(false)

	t.Run("Returns relative URL error for localhost without scheme", func(t *testing.T) {
		// Create a new request
		req := httptest.NewRequest(http.MethodGet, "/?scalar_url=localhost", nil)
		w := httptest.NewRecorder()

		// Call the handler directly
		proxyServer.handleRequest(w, req)

		// Check the response
		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status code %d, got %d", http.StatusBadRequest, w.Code)
		}

		expectedError := scalarURLValidationErrors[1].message
		if w.Body.String() != expectedError+"\n" {
			t.Errorf("Expected relative URL validation error message")
		}
	})

	t.Run("Should not authorize VPC metadata", func(t *testing.T) {
		// Create a new request
		req := httptest.NewRequest(http.MethodGet, "/?scalar_url=https://metadata.google.internal", nil)
		w := httptest.NewRecorder()

		// Call the handler directly
		proxyServer.handleRequest(w, req)

		// Check the response
		if w.Code != http.StatusForbidden {
			t.Errorf("Expected status code %d, got %d", http.StatusForbidden, w.Code)
		}
	})

	t.Run("Should not authorize VPC metadata IP", func(t *testing.T) {
		// Create a new request
		req := httptest.NewRequest(http.MethodGet, "/?scalar_url=http://169.254.169.254", nil)
		w := httptest.NewRecorder()

		// Call the handler directly
		proxyServer.handleRequest(w, req)

		// Check the response
		if w.Code != http.StatusForbidden {
			t.Errorf("Expected status code %d, got %d", http.StatusForbidden, w.Code)
		}
	})
}

func TestBlockedTransitionAddresses(t *testing.T) {
	// IPv6 transition addresses embed an IPv4 destination. When that IPv4 sits
	// in a blocked range the whole address must be blocked, otherwise a
	// hostname with an AAAA record pointing at such an address (or a direct dial
	// after the brackets are stripped) would bypass the IPv4 blocklist.
	blocked := []string{
		"2002:a9fe:a9fe::",       // 6to4 -> 169.254.169.254
		"2002:c0a8:0101::",       // 6to4 -> 192.168.1.1
		"64:ff9b::a9fe:a9fe",     // NAT64 -> 169.254.169.254
		"64:ff9b::c0a8:0101",     // NAT64 -> 192.168.1.1
		"::a9fe:a9fe",            // IPv4-compatible -> 169.254.169.254
		"::ffff:169.254.169.254", // IPv4-mapped -> 169.254.169.254
	}

	for _, host := range blocked {
		if !isBlockedHost(context.Background(), host) {
			t.Errorf("Expected %s to be blocked", host)
		}
	}

	// Transition addresses that embed a public IPv4 stay allowed.
	allowed := []string{
		"2002:0808:0808::",   // 6to4 -> 8.8.8.8
		"64:ff9b::0808:0808", // NAT64 -> 8.8.8.8
	}

	for _, host := range allowed {
		if isBlockedHost(context.Background(), host) {
			t.Errorf("Expected %s to be allowed", host)
		}
	}
}

func TestUntrustedContentHeaders(t *testing.T) {
	proxyServer := NewProxyServer(true)

	t.Run("Sandboxes a proxied SVG so its scripts cannot run on the proxy origin", func(t *testing.T) {
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "image/svg+xml")
			w.Write([]byte(`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.domain)</script></svg>`))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url+"/evil.svg"), nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if got := w.Header().Values("Content-Security-Policy"); len(got) != 1 || got[0] != untrustedContentSecurityPolicy {
			t.Errorf("Expected Content-Security-Policy %q, got %v", untrustedContentSecurityPolicy, got)
		}
		if got := w.Header().Get("X-Content-Type-Options"); got != "nosniff" {
			t.Errorf("Expected X-Content-Type-Options 'nosniff', got '%s'", got)
		}
		// The body itself is still proxied as-is, so the API client sees the real response
		if got := w.Header().Get("Content-Type"); got != "image/svg+xml" {
			t.Errorf("Expected Content-Type 'image/svg+xml', got '%s'", got)
		}
	})

	t.Run("Sandboxes proxied HTML", func(t *testing.T) {
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/html")
			w.Write([]byte(`<script>location = 'https://attacker.example'</script>`))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if got := w.Header().Get("Content-Security-Policy"); got != untrustedContentSecurityPolicy {
			t.Errorf("Expected Content-Security-Policy %q, got %q", untrustedContentSecurityPolicy, got)
		}
	})

	t.Run("Replaces upstream policies and passes them on as X-Scalar-Original-*", func(t *testing.T) {
		const upstreamPolicy = "sandbox allow-scripts allow-top-navigation; script-src * 'unsafe-inline'"
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Security-Policy", upstreamPolicy)
			w.Header().Set("Content-Security-Policy-Report-Only", "default-src 'none'; report-uri https://attacker.example/report")
			w.Header().Set("X-Content-Type-Options", "something-else")
			w.Header().Set("X-Scalar-Modified-Headers", "Content-Type")
			w.Write([]byte("ok"))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		// Only our policy is enforced, so the upstream one cannot loosen the sandbox
		if got := w.Header().Values("Content-Security-Policy"); len(got) != 1 || got[0] != untrustedContentSecurityPolicy {
			t.Errorf("Expected only the sandbox policy, got %v", got)
		}
		if got := w.Header().Values("Content-Security-Policy-Report-Only"); len(got) != 0 {
			t.Errorf("Expected no Content-Security-Policy-Report-Only, got %v", got)
		}
		if got := w.Header().Values("X-Content-Type-Options"); len(got) != 1 || got[0] != "nosniff" {
			t.Errorf("Expected a single X-Content-Type-Options 'nosniff', got %v", got)
		}

		// The API client restores these for display
		if got := w.Header().Get("X-Scalar-Original-Content-Security-Policy"); got != upstreamPolicy {
			t.Errorf("Expected X-Scalar-Original-Content-Security-Policy %q, got %q", upstreamPolicy, got)
		}
		if got := w.Header().Get("X-Scalar-Original-X-Content-Type-Options"); got != "something-else" {
			t.Errorf("Expected X-Scalar-Original-X-Content-Type-Options 'something-else', got %q", got)
		}
		if got := w.Header().Get("X-Scalar-Modified-Headers"); got != "Cache-Control, Content-Security-Policy, Vary, X-Content-Type-Options" {
			t.Errorf("Expected X-Scalar-Modified-Headers to list the proxy's headers, got %q", got)
		}
	})

	t.Run("Does not forward headers the browser acts on for the proxy origin", func(t *testing.T) {
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Refresh", "0; url=https://attacker.example/phish")
			w.Header().Set("Clear-Site-Data", `"cookies", "storage"`)
			w.Header().Set("Set-Cookie", "session=attacker; Domain=scalar.com; Path=/")
			w.Write([]byte("ok"))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		for _, header := range []string{"Refresh", "Clear-Site-Data", "Set-Cookie"} {
			if got := w.Header().Values(header); len(got) != 0 {
				t.Errorf("Expected %s to be removed, got %v", header, got)
			}
		}

		// The values are still available to the API client, under names browsers ignore
		if got := w.Header().Get("X-Scalar-Original-Refresh"); got != "0; url=https://attacker.example/phish" {
			t.Errorf("Expected X-Scalar-Original-Refresh, got %q", got)
		}
		if got := w.Header().Get("X-Scalar-Original-Clear-Site-Data"); got != `"cookies", "storage"` {
			t.Errorf("Expected X-Scalar-Original-Clear-Site-Data, got %q", got)
		}
		if got := w.Header().Get("X-Scalar-Set-Cookie"); got != "session=attacker; Domain=scalar.com; Path=/" {
			t.Errorf("Expected X-Scalar-Set-Cookie, got %q", got)
		}
	})

	t.Run("Does not forward headers that browsers apply to the proxy origin from fetch() responses", func(t *testing.T) {
		upstreamHeaders := map[string]string{
			"NEL":                                    `{"report_to":"attacker","max_age":31536000,"success_fraction":1}`,
			"Report-To":                              `{"group":"attacker","max_age":31536000,"endpoints":[{"url":"https://attacker.example/report"}]}`,
			"Reporting-Endpoints":                    `attacker="https://attacker.example/report"`,
			"Strict-Transport-Security":              "max-age=0",
			"Alt-Svc":                                `h3=":443"; ma=86400`,
			"Set-Login":                              "logged-in",
			"Observe-Browsing-Topics":                "?1",
			"Attribution-Reporting-Register-Source":  `{"destination":"https://attacker.example"}`,
			"Attribution-Reporting-Register-Trigger": `{}`,
		}
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			for key, value := range upstreamHeaders {
				w.Header().Set(key, value)
			}
			w.Write([]byte("ok"))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		for key, value := range upstreamHeaders {
			if got := w.Header().Values(key); len(got) != 0 {
				t.Errorf("Expected %s to be removed, got %v", key, got)
			}
			if got := w.Header().Get("X-Scalar-Original-" + key); got != value {
				t.Errorf("Expected X-Scalar-Original-%s %q, got %q", key, value, got)
			}
		}
	})

	t.Run("Does not let one upstream make the browser cache ignore scalar_url", func(t *testing.T) {
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Cache-Control", "public, max-age=3600")
			w.Header().Set("No-Vary-Search", "params")
			w.Write([]byte(`{"poisoned":true}`))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url+"/poison"), nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if got := w.Header().Values("No-Vary-Search"); len(got) != 0 {
			t.Errorf("Expected No-Vary-Search to be removed, got %v", got)
		}
		if got := w.Header().Get("X-Scalar-Original-No-Vary-Search"); got != "params" {
			t.Errorf("Expected X-Scalar-Original-No-Vary-Search 'params', got %q", got)
		}
	})

	t.Run("Keeps proxied responses out of shared caches", func(t *testing.T) {
		tests := []struct {
			upstream []string
			expected string
		}{
			{upstream: nil, expected: "private"},
			{upstream: []string{"public, max-age=3600"}, expected: "private, max-age=3600"},
			{upstream: []string{"s-maxage=600, max-age=60, proxy-revalidate"}, expected: "private, max-age=60"},
			{upstream: []string{"no-store"}, expected: "private, no-store"},
			{upstream: []string{"private=\"Set-Cookie\", no-cache", "must-revalidate"}, expected: "private, no-cache, must-revalidate"},
			{upstream: []string{`private="Set-Cookie, X-Foo", max-age=60`}, expected: "private, max-age=60"},
			{upstream: []string{`no-cache="Set-Cookie, X-Foo", max-age=60`}, expected: `private, no-cache="Set-Cookie, X-Foo", max-age=60`},
			{upstream: []string{`ext="a \" , b", max-age=5`}, expected: `private, ext="a \" , b", max-age=5`},
		}

		for _, tc := range tests {
			targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
				for _, value := range tc.upstream {
					w.Header().Add("Cache-Control", value)
				}
				w.Header().Set("CDN-Cache-Control", "max-age=86400")
				w.Header().Set("Cloudflare-CDN-Cache-Control", "max-age=86400")
				w.Header().Set("Surrogate-Control", "max-age=86400")
				w.Write([]byte("ok"))
			})

			req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
			w := httptest.NewRecorder()

			proxyServer.handleRequest(w, req)
			targetServer.server.Close()

			if got := w.Header().Values("Cache-Control"); len(got) != 1 || got[0] != tc.expected {
				t.Errorf("Upstream %v: expected Cache-Control %q, got %v", tc.upstream, tc.expected, got)
			}
			if got := w.Header().Get("X-Scalar-Original-Cache-Control"); got != strings.Join(tc.upstream, ", ") {
				t.Errorf("Upstream %v: expected X-Scalar-Original-Cache-Control %q, got %q", tc.upstream, strings.Join(tc.upstream, ", "), got)
			}
			for _, header := range []string{"CDN-Cache-Control", "Cloudflare-CDN-Cache-Control", "Surrogate-Control"} {
				if got := w.Header().Values(header); len(got) != 0 {
					t.Errorf("Expected %s to be removed, got %v", header, got)
				}
			}
		}
	})

	t.Run("Does not forward header families that set browser state", func(t *testing.T) {
		upstreamHeaders := []string{
			"Sec-Session-Registration",
			"Secure-Session-Registration",
			"Sec-Private-State-Token",
			"Shared-Storage-Write",
			"Ad-Auction-Signals",
			"Ad-Auction-Allowed",
			"Activate-Storage-Access",
			"Attribution-Reporting-Register-Os-Source",
			"Use-As-Dictionary",
			"Edge-Control",
			"X-Accel-Redirect",
			"X-Accel-Expires",
			"X-Sendfile",
			"X-Lighttpd-Send-File",
		}
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			for _, key := range upstreamHeaders {
				w.Header().Set(key, "value")
			}
			w.Write([]byte("ok"))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		for _, key := range upstreamHeaders {
			if got := w.Header().Values(key); len(got) != 0 {
				t.Errorf("Expected %s to be removed, got %v", key, got)
			}
			if got := w.Header().Get("X-Scalar-Original-" + key); got != "value" {
				t.Errorf("Expected X-Scalar-Original-%s 'value', got %q", key, got)
			}
		}
	})

	t.Run("Drops upstream headers that use the proxy's reserved names", func(t *testing.T) {
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			// An empty suffix would make the client restore a header with no name
			w.Header()["X-Scalar-Original-"] = []string{"broken"}
			w.Header().Set("X-Scalar-Original-Content-Type", "text/html")
			w.Header().Set("X-Scalar-Set-Cookie", "fake=1")
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte("ok"))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		for _, key := range []string{"X-Scalar-Original-", "X-Scalar-Original-Content-Type", "X-Scalar-Set-Cookie"} {
			if got := w.Header().Values(key); len(got) != 0 {
				t.Errorf("Expected %s to be removed, got %v", key, got)
			}
		}
		if got := w.Header().Get("Content-Type"); got != "application/json" {
			t.Errorf("Expected Content-Type 'application/json', got %q", got)
		}
	})

	t.Run("Does not send compression dictionaries stored for the proxy origin to the target", func(t *testing.T) {
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			for _, header := range []string{"Available-Dictionary", "Dictionary-Id"} {
				if got := r.Header.Get(header); got != "" {
					t.Errorf("Expected %s not to reach the target, got %q", header, got)
				}
			}
			w.Write([]byte("ok"))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
		req.Header.Set("Available-Dictionary", ":pZGm1Av0IEBKARczz7exkNYsZb8LzaMrV7J32a2fFG4=:")
		req.Header.Set("Dictionary-ID", `"tracking-id"`)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)
	})

	t.Run("Varies on the Sec-Fetch headers and keeps the upstream Vary", func(t *testing.T) {
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Vary", "Accept")
			w.Write([]byte("ok"))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		vary := strings.Join(w.Header().Values("Vary"), ", ")
		for _, header := range []string{"Sec-Fetch-Mode", "Sec-Fetch-Dest", "Accept"} {
			if !strings.Contains(vary, header) {
				t.Errorf("Expected Vary to include %s, got %q", header, vary)
			}
		}

		// The API client shows only the upstream's Vary
		if got := w.Header().Get("X-Scalar-Original-Vary"); got != "Accept" {
			t.Errorf("Expected X-Scalar-Original-Vary 'Accept', got %q", got)
		}
	})

	t.Run("Sandboxes error responses from the target", func(t *testing.T) {
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/html")
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`<script>alert(1)</script>`))
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if w.Code != http.StatusNotFound {
			t.Errorf("Expected status code %d, got %d", http.StatusNotFound, w.Code)
		}
		if got := w.Header().Get("Content-Security-Policy"); got != untrustedContentSecurityPolicy {
			t.Errorf("Expected Content-Security-Policy %q, got %q", untrustedContentSecurityPolicy, got)
		}
	})

	t.Run("Does not sandbox the proxy's own landing page", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if got := w.Header().Get("Content-Security-Policy"); got != "" {
			t.Errorf("Expected no Content-Security-Policy on the landing page, got %q", got)
		}
	})
}

func TestServiceWorkerRequests(t *testing.T) {
	proxyServer := NewProxyServer(true)

	t.Run("Answers an update check with a script that unregisters the worker", func(t *testing.T) {
		called := false
		targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
			called = true
		})
		defer targetServer.server.Close()

		req := httptest.NewRequest(http.MethodGet, "/nested/worker.js?scalar_url="+url.QueryEscape(targetServer.url), nil)
		req.Header.Set("Sec-Fetch-Mode", "same-origin")
		req.Header.Set("Sec-Fetch-Dest", "serviceworker")
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		// Anything but a successful script response leaves the old worker installed
		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
		if got := w.Header().Get("Content-Type"); got != "text/javascript" {
			t.Errorf("Expected a JavaScript content type, got %q", got)
		}
		if got := w.Header().Get("Service-Worker-Allowed"); got != "/" {
			t.Errorf("Expected cleanup to allow root scope, got %q", got)
		}
		if got := w.Header().Get("Cache-Control"); got != "no-store" {
			t.Errorf("Expected the script not to be cached, got %q", got)
		}
		if !strings.Contains(w.Body.String(), "registration.unregister()") {
			t.Errorf("Expected a script that unregisters the worker, got %q", w.Body.String())
		}
		if called {
			t.Error("Expected the target not to be contacted")
		}
	})
}

func TestSpeculationRulesHeader(t *testing.T) {
	proxyServer := NewProxyServer(true)

	targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Speculation-Rules", `"https://attacker.example/rules.json"`)
	})
	defer targetServer.server.Close()

	req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
	w := httptest.NewRecorder()

	proxyServer.handleRequest(w, req)

	if got := w.Header().Get("Speculation-Rules"); got != "" {
		t.Errorf("Expected the header to be removed, got %q", got)
	}
	if got := w.Header().Get("X-Scalar-Original-Speculation-Rules"); got != `"https://attacker.example/rules.json"` {
		t.Errorf("Expected the upstream value to be passed on, got %q", got)
	}
}

func TestDocumentRequests(t *testing.T) {
	proxyServer := NewProxyServer(true)

	documentRequests := []struct {
		name    string
		headers map[string]string
	}{
		{name: "top-level navigation", headers: map[string]string{"Sec-Fetch-Mode": "navigate", "Sec-Fetch-Dest": "document"}},
		{name: "iframe", headers: map[string]string{"Sec-Fetch-Mode": "navigate", "Sec-Fetch-Dest": "iframe"}},
		{name: "object", headers: map[string]string{"Sec-Fetch-Mode": "no-cors", "Sec-Fetch-Dest": "object"}},
		{name: "embed", headers: map[string]string{"Sec-Fetch-Mode": "no-cors", "Sec-Fetch-Dest": "embed"}},
		{name: "older Chrome iframe", headers: map[string]string{"Sec-Fetch-Mode": "nested-navigate", "Sec-Fetch-Dest": "iframe"}},
		{name: "worker", headers: map[string]string{"Sec-Fetch-Mode": "same-origin", "Sec-Fetch-Dest": "worker"}},
		{name: "shared worker", headers: map[string]string{"Sec-Fetch-Mode": "same-origin", "Sec-Fetch-Dest": "sharedworker"}},
	}

	for _, tc := range documentRequests {
		t.Run("Refuses "+tc.name+" requests without contacting the target", func(t *testing.T) {
			called := false
			targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
				called = true
				w.Write([]byte("<script>alert(1)</script>"))
			})
			defer targetServer.server.Close()

			for _, method := range []string{http.MethodGet, http.MethodPost} {
				req := httptest.NewRequest(method, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
				for key, value := range tc.headers {
					req.Header.Set(key, value)
				}
				w := httptest.NewRecorder()

				proxyServer.handleRequest(w, req)

				if w.Code != http.StatusForbidden {
					t.Errorf("%s: expected status code %d, got %d", method, http.StatusForbidden, w.Code)
				}
				if got := w.Header().Get("Content-Type"); !strings.HasPrefix(got, "text/plain") {
					t.Errorf("%s: expected a text/plain error, got %q", method, got)
				}
				if got := w.Header().Get("Vary"); !strings.Contains(got, "Sec-Fetch-Mode") {
					t.Errorf("%s: expected the refusal to vary on Sec-Fetch-Mode, got %q", method, got)
				}
			}

			if called {
				t.Error("Expected the target not to be contacted")
			}
		})
	}

	programmaticRequests := []struct {
		name    string
		headers map[string]string
	}{
		{name: "fetch()", headers: map[string]string{"Sec-Fetch-Mode": "cors", "Sec-Fetch-Dest": "empty"}},
		{name: "same-origin fetch()", headers: map[string]string{"Sec-Fetch-Mode": "same-origin", "Sec-Fetch-Dest": "empty"}},
		{name: "non-browser client", headers: map[string]string{}},
	}

	for _, tc := range programmaticRequests {
		t.Run("Proxies "+tc.name+" requests", func(t *testing.T) {
			targetServer := setupTestServer(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte("ok"))
			})
			defer targetServer.server.Close()

			req := httptest.NewRequest(http.MethodGet, "/?scalar_url="+url.QueryEscape(targetServer.url), nil)
			for key, value := range tc.headers {
				req.Header.Set(key, value)
			}
			w := httptest.NewRecorder()

			proxyServer.handleRequest(w, req)

			if w.Code != http.StatusOK || w.Body.String() != "ok" {
				t.Errorf("Expected 200 'ok', got %d %q", w.Code, w.Body.String())
			}
		})
	}

	t.Run("Still serves the landing page to browsers", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Sec-Fetch-Mode", "navigate")
		req.Header.Set("Sec-Fetch-Dest", "document")
		w := httptest.NewRecorder()

		proxyServer.handleRequest(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
	})
}
