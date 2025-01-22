package main

import (
	"crypto/tls"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
)

// Set up and start the proxy server. The server is designed to bypass CORS and make cross-origin requests in browsers
// behave like server-side requests (or let’s say like `curl`).
func main() {
	// The default port
	port := ":1337"

	// Allow to overwrite the port with an environment variable
	if p := os.Getenv("PORT"); p != "" {
		port = ":" + p
	}

	// Create a new proxy server instance
	proxyServer := NewProxyServer()

	// Set up routing using the default HTTP multiplexer
	mux := http.NewServeMux()
	mux.HandleFunc("/", proxyServer.handleRequest)

	// Add our custom CORS middleware to handle cross-origin requests
	handler := corsMiddleware(mux)

	log.Println("🥤 Proxy Server listening on http://localhost" + port)

	// Start the server and log any errors that occur
	if err := http.ListenAndServe(port, handler); err != nil {
		log.Fatal("⚠️ Error starting the Proxy Server: ", err)
	}
}

// ProxyServer encapsulates the proxy server configuration and handlers.
//
// It uses a custom transport to handle HTTPS connections, including those
// with self-signed certificates for development environments.
type ProxyServer struct {
	transport *http.Transport
}

// NewProxyServer creates a new proxy server instance
func NewProxyServer() *ProxyServer {
	return &ProxyServer{
		transport: &http.Transport{
			// Skip TLS verification. This is useful for development environments
			// where the target API might use self-signed certificates.
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}
}

// Processes all incoming HTTP requests.
//
// It serves both as a proxy for API requests, but also provides some utility endpoints.
//
// - /openapi.yaml: OpenAPI specification
// For all other paths, it forwards the request to the URL specified in scalar_url
func (ps *ProxyServer) handleRequest(w http.ResponseWriter, r *http.Request) {
	// Health check
	if r.URL.Path == "/ping" {
		w.Write([]byte("pong"))

		return
	}

	// Serve an API reference on root
	if r.URL.Path == "/" && r.URL.RawQuery == "" {
		w.Header().Set("Content-Type", "text/html")
		content, err := os.ReadFile("public/index.html")
		if err != nil {
			http.Error(w, "Error reading index.html", http.StatusInternalServerError)
			return
		}
		w.Write(content)
		return
	}

	// Serve the OpenAPI document
	if r.URL.Path == "/openapi.yaml" {
		w.Header().Set("Content-Type", "text/yaml")
		content, err := os.ReadFile("public/openapi.yaml")
		if err != nil {
			http.Error(w, "Error reading openapi.yaml", http.StatusInternalServerError)
			return
		}
		w.Write(content)
		return
	}

	// Get and validate the target URL from the `scalar_url` query parameter
	target := r.URL.Query().Get("scalar_url")

	// Show an error if the scalar_url is missing
	if target == "" {
		http.Error(w, "The `scalar_url` query parameter is required. Try to add `?scalar_url=https%3A%2F%2Fgalaxy.scalar.com%2Fplanets` to the URL.", http.StatusBadRequest)
		return
	}

	// Validate the URL
	remote, err := url.Parse(target)
	if err != nil {
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		return
	}

	// Log the request
	log.Println(r.Method, target)

	// Create and execute the proxy request
	if err := ps.executeProxyRequest(w, r, remote, target); err != nil {
		// Log any errors
		log.Printf("[ERROR] %v\n", err)
	}
}

// executeProxyRequest handles the proxying logic
//
// 1. Preserves all original headers (except CORS headers)
// 2. Maintains session state through redirects
// 3. Adds consistent CORS headers to allow browser access
// 4. Tracks the final URL after any redirects
func (ps *ProxyServer) executeProxyRequest(w http.ResponseWriter, r *http.Request, remote *url.URL, target string) error {
	client := &http.Client{
		Transport: ps.transport,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			// Copy headers from the original request to maintain authentication
			// and other important headers through redirect chains.
			for key, values := range via[0].Header {
				req.Header[key] = values
			}

			return nil
		},
	}

	// Create the outbound request
	outreq, err := http.NewRequest(r.Method, target, r.Body)

	// Return error if request creation fails
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)

		return err
	}

	// Copy the headers but exclude Origin. It’s not required and might confuse some target servers.
	for key, values := range r.Header {
		if !strings.EqualFold(strings.ToLower(key), "origin") {
			outreq.Header[key] = values
		}
	}

	// Redirect X-Scalar-Cookie header as Cookie header
	if xScalarCookie := r.Header.Get("X-Scalar-Cookie"); xScalarCookie != "" {
		// Set the cookie
		outreq.Header.Set("Cookie", xScalarCookie)
		// Remove the X-Scalar-Cookie header
		outreq.Header.Del("X-Scalar-Cookie")
	}

	// Make the request
	resp, err := client.Do(outreq)

	if err != nil {
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		return err
	}

	// Close response body when done to prevent resource leaks
	defer resp.Body.Close()

	// Copy headers from final response, but skip CORS headers
	for key, values := range resp.Header {

		// Check if header is a CORS headers
		isCorsHeader := func(header string) bool {
			return strings.HasPrefix(strings.ToLower(header), "access-control-")
		}

		if !isCorsHeader(key) {
			for _, value := range values {
				w.Header().Add(key, value)
			}
		}
	}

	// Add CORS headers here, after the response headers are copied
	allowOrigin := "*"

	if r.Header.Get("Origin") != "" {
		allowOrigin = r.Header.Get("Origin")
	}

	w.Header().Set("Access-Control-Allow-Headers", "*")
	w.Header().Set("Access-Control-Allow-Origin", allowOrigin)
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH")
	w.Header().Set("Access-Control-Expose-Headers", "*")

	// Add the final URL as a header
	w.Header().Set("X-Forwarded-Host", resp.Request.URL.String())

	// Copy the status code from the proxied response
	w.WriteHeader(resp.StatusCode)

	// Copy the body
	if _, err := io.Copy(w, resp.Body); err != nil {
		return err
	}

	return nil
}

// Handle preflight requests and ensures browsers can access the proxy regardless of where the request originates from.
// This is essential to make cross-origin requests work in browser environments.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Headers", "*")

		allowOrigin := "*"

		if r.Header.Get("Origin") != "" {
			allowOrigin = r.Header.Get("Origin")
		}

		w.Header().Set("Access-Control-Allow-Origin", allowOrigin)
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH")
		w.Header().Set("Access-Control-Expose-Headers", "*")

		// Handle pre-flight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)

			return
		}

		// Pass down the request to the next middleware or handler
		next.ServeHTTP(w, r)
	})
}
