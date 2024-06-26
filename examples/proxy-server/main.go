package main

import (
	"crypto/tls"
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
		// Original behavior
		http.Error(w, e.Error(), http.StatusServiceUnavailable)

		// Output the error to the console
		log.Printf("[ERROR] %v\n", e)
	}

	// Modify the request to indicate it is proxied
	r.URL.Host = remote.Host
	r.URL = remote
	r.URL.Scheme = remote.Scheme
	r.URL.Path = remote.Path

	r.Header.Set("X-Forwarded-Host", r.Header.Get("Host"))

	r.Host = remote.Host

	proxy.ServeHTTP(w, r)
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
