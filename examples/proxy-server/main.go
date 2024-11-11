package main

import (
	"crypto/tls"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
)

// corsMiddleware adds CORS headers to the response and handles pre-flight requests.
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

// createReverseProxy creates a configured reverse proxy for the given target
func (ps *ProxyServer) createReverseProxy(remote *url.URL, r *http.Request) *httputil.ReverseProxy {
	proxy := httputil.NewSingleHostReverseProxy(remote)
	proxy.Transport = ps.transport

	proxy.Director = func(req *http.Request) {
		req.Header = r.Header
		req.Host = remote.Host
		req.URL.Scheme = remote.Scheme
		req.URL.Host = remote.Host
		req.URL.Path = r.URL.Path
	}

	// Modify the response to remove original CORS headers
	proxy.ModifyResponse = func(res *http.Response) error {
		// Remove all CORS headers from the target response
		res.Header.Del("Access-Control-Allow-Headers")
		res.Header.Del("Access-Control-Allow-Origin")
		res.Header.Del("Access-Control-Allow-Methods")
		res.Header.Del("Access-Control-Allow-Credentials")
		res.Header.Del("Access-Control-Expose-Headers")
		return nil
	}

	// Deal with network errors
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, e error) {
		if urlError, ok := e.(*url.Error); ok {
			if urlError.Err == http.ErrUseLastResponse {
				// This error occurs when we receive a redirect
				return
			}
		}
		// Original error handling for other errors
		http.Error(w, e.Error(), http.StatusServiceUnavailable)
		log.Printf("[ERROR] %v\n", e)
	}

	return proxy
}

// handleRequest remains as the main handler but uses ProxyServer methods
func (ps *ProxyServer) handleRequest(w http.ResponseWriter, r *http.Request) {
	// Handle ping request
	if r.URL.Path == "/ping" {
		log.Println("/ping")
		w.Write([]byte("pong"))
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
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		log.Printf("[ERROR] %v\n", err)
	}
}

// executeProxyRequest handles the actual proxying logic
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
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		log.Printf("[ERROR] %v\n", err)
		return err
	}

	// Copy the headers
	outreq.Header = r.Header

	// Make the request
	resp, err := client.Do(outreq)
	if err != nil {
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		log.Printf("[ERROR] %v\n", err)
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

	// Copy the status code
	w.WriteHeader(resp.StatusCode)

	// Copy the body
	if _, err := io.Copy(w, resp.Body); err != nil {
		log.Printf("[ERROR] Failed to copy response body: %v\n", err)
		return err
	}

	// Modify the request to indicate it is proxied
	r.URL.Host = remote.Host
	r.URL = remote
	r.URL.Scheme = remote.Scheme
	r.URL.Path = remote.Path

	r.Header.Set("X-Forwarded-Host", r.Header.Get("Host"))

	r.Host = remote.Host

	return nil
}

func main() {
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
		log.Fatal("Error starting proxy server: ", err)
	}
}
