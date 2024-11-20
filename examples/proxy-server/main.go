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

func main() {
	// Default port
	port := ":1337"

	if p := os.Getenv("PORT"); p != "" {
		port = ":" + p
	}

	proxyServer := NewProxyServer()
	mux := http.NewServeMux()
	mux.HandleFunc("/", proxyServer.handleRequest)

	handler := corsMiddleware(mux)

	log.Println("🥤 Proxy Server listening on http://localhost" + port)

	if err := http.ListenAndServe(port, handler); err != nil {
		log.Fatal("⚠️ Error starting the Proxy Server: ", err)
	}
}

// ProxyServer encapsulates the proxy server configuration and handlers
type ProxyServer struct {
	transport *http.Transport
}

// NewProxyServer creates a new proxy server instance
func NewProxyServer() *ProxyServer {
	return &ProxyServer{
		transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}
}

// Handle all incoming requests
func (ps *ProxyServer) handleRequest(w http.ResponseWriter, r *http.Request) {
	// Health check
	if r.URL.Path == "/ping" {
		w.Write([]byte("pong"))
		return
	}

	// Serve HTML page for root path
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

	// Serve OpenAPI spec for /openapi.yaml path
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

	// Get and validate target URL
	target := r.URL.Query().Get("scalar_url")
	if target == "" {
		http.Error(w, "The `scalar_url` query parameter is required. Try to add `?scalar_url=https%3A%2F%2Fgalaxy.scalar.com%2Fplanets` to the URL.", http.StatusBadRequest)
		return
	}

	remote, err := url.Parse(target)
	if err != nil {
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		return
	}

	log.Println(r.Method, target)

	// Create and execute the proxy request
	if err := ps.executeProxyRequest(w, r, remote, target); err != nil {
		// Only log the error, don't override the response
		// The status code should already be set by executeProxyRequest
		log.Printf("[ERROR] %v\n", err)
	}
}

// The actual proxying logic
func (ps *ProxyServer) executeProxyRequest(w http.ResponseWriter, r *http.Request, remote *url.URL, target string) error {
	client := &http.Client{
		Transport: ps.transport,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			for key, values := range via[0].Header {
				req.Header[key] = values
			}
			return nil
		},
	}

	// Create the outbound request
	outreq, err := http.NewRequest(r.Method, target, r.Body)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return err
	}

	// Copy the headers
	outreq.Header = r.Header

	// Make the request
	resp, err := client.Do(outreq)

	if err != nil {
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		return err
	}

	defer resp.Body.Close()

	// Copy headers from final response, but skip CORS headers
	for key, values := range resp.Header {
		// Check if header is a CORS header
		isCORSHeader := func(header string) bool {
			return strings.HasPrefix(strings.ToLower(header), "access-control-")
		}

		if !isCORSHeader(key) {
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

// Adds CORS headers to the response and handle pre-flight requests
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

		// Pass down the request to the next middleware (or final handler)
		next.ServeHTTP(w, r)
	})
}
