package main

import (
	"crypto/tls"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
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

// Handler that forwards requests to the target and writes the response back to the original client
func handleRequest(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	queryValues := r.URL.Query()
	target := queryValues.Get("scalar_url")

	remote, _ := url.Parse(target)

	// If the requested path is /ping, return a simple response.
	if r.URL.Path == "/ping" {
		log.Println("/ping")

		w.Write([]byte("pong"))
		return
	}

	// The URL parameter is required. Return a helpful error message if it’s not provided.
	if target == "" {
		http.Error(
			w,
			"The `scalar_url` query parameter is required. Try to add `?scalar_url=https%3A%2F%2Fgalaxy.scalar.com%2Fplanets` to the URL.", http.StatusBadRequest,
		)

		return
	}

	// we can eventually do a check on the type of request
	// i.e. websocket vs mqtt vs grpc
	// but let's handle just http for now :)

	// Log the request
	// Format: [HTTP Method] [Target URL]
	log.Println(r.Method, target)

	proxy := httputil.NewSingleHostReverseProxy(remote)

	proxy.Transport = &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}

	proxy.Director = func(req *http.Request) {
		req.Header = r.Header
		req.Host = remote.Host
		req.URL.Scheme = remote.Scheme
		req.URL.Host = remote.Host
		req.URL.Path = r.URL.Path
	}

	// Modify the response to remove original CORS headers
	proxy.ModifyResponse = func(res *http.Response) error {
		res.Header.Del("Access-Control-Allow-Headers")
		res.Header.Del("Access-Control-Allow-Origin")
		res.Header.Del("Access-Control-Allow-Methods")
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

	// Create a custom client to handle redirects
	client := &http.Client{
		Transport: proxy.Transport,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			// Copy original headers to redirected request
			for key, values := range via[0].Header {
				req.Header[key] = values
			}
			return nil
		},
	}

	// Create a new request instead of reusing the original one
	outreq, err := http.NewRequest(r.Method, target+r.URL.Path, r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		log.Printf("[ERROR] %v\n", err)
		return
	}

	// Copy the headers
	outreq.Header = r.Header

	// Make the request and follow redirects
	resp, err := client.Do(outreq)
	if err != nil {
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		log.Printf("[ERROR] %v\n", err)
		return
	}
	defer resp.Body.Close()

	// Copy headers from final response
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}

	// Copy the status code
	w.WriteHeader(resp.StatusCode)

	// Copy the body
	if _, err := io.Copy(w, resp.Body); err != nil {
		log.Printf("[ERROR] Failed to copy response body: %v\n", err)
	}

	// Modify the request to indicate it is proxied
	r.URL.Host = remote.Host
	r.URL = remote
	r.URL.Scheme = remote.Scheme
	r.URL.Path = remote.Path

	r.Header.Set("X-Forwarded-Host", r.Header.Get("Host"))

	r.Host = remote.Host
}

func main() {
	port := ":1337"

	if p := os.Getenv("PORT"); p != "" {
		port = ":" + os.Getenv("PORT")
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/", handleRequest)

	handler := corsMiddleware(mux)

	// Console output
	log.Println("🥤 Proxy Server listening on http://localhost" + port)

	err := http.ListenAndServe(port, handler)

	if err != nil {
		log.Fatal("Error starting proxy server: ", err)
	}
}
