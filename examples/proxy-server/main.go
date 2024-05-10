package main

import (
	"crypto/tls"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
)

// Handler that forwards requests to the target and writes the response back to the original client
func handleRequest(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	queryValues := r.URL.Query()
	target := queryValues.Get("scalar_url")

	remote, _ := url.Parse(target)

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

	// Modify the request to indicate it is proxied
	r.URL.Host = remote.Host
	r.URL = remote
	r.URL.Scheme = remote.Scheme
	r.URL.Path = remote.Path

	r.Header.Set("X-Forwarded-Host", r.Header.Get("Host"))
	r.Host = remote.Host

	proxy.ServeHTTP(w, r)
}

// Handler that forwards requests to the target and writes the response back to the original client
// func handleRequest(w http.ResponseWriter, r *http.Request) {
// 	// Parse query parameters
// 	queryValues := r.URL.Query()
// 	target := queryValues.Get("scalar_url")

// 	// If the requested path is /ping, return a simple response.
// 	if r.URL.Path == "/ping" {
// 		log.Println("/ping")

// 		w.Write([]byte("pong"))
// 		return
// 	}

// 	// The URL parameter is required. Return a helpful error message if it’s not provided.
// 	if target == "" {
// 		http.Error(
// 			w,
// 			"The `scalar_url` query parameter is required. Try to add `?scalar_url=https%3A%2F%2Fgalaxy.scalar.com%2Fplanets` to the URL.", http.StatusBadRequest,
// 		)

// 		return
// 	}

// 	// we can eventually do a check on the type of request
// 	// i.e. websocket vs mqtt vs grpc
// 	// but let's handle just http for now :)

// 	// Log the request
// 	// Format: [HTTP Method] [Target URL]
// 	log.Println(r.Method, target)

// 	proxyUrl, _ := url.Parse(target)

// 	// Create a reverse proxy
// 	proxy := httputil.NewSingleHostReverseProxy(proxyUrl)

// 	proxy.Transport = &http.Transport{
// 		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
// 	}

// 	// Modify the request to indicate it is proxied
// 	// r.URL.Host = proxyUrl.Host
// 	r.URL = proxyUrl
// 	// r.URL.Scheme = proxyUrl.Scheme
// 	// r.URL.Path = proxyUrl.Path

// 	// r.Header.Set("X-Forwarded-Host", r.Header.Get("Host"))
// 	// r.Host = proxyUrl.Host

// 	log.Println(r)

// 	// ServeHttp uses the given ResponseWriter and Request to do the proxying
// 	proxy.ServeHTTP(w, r)
// }

func main() {
	port := ":1337"

	if p := os.Getenv("PORT"); p != "" {
		port = ":" + os.Getenv("PORT")
	}

	http.HandleFunc("/", handleRequest)

	// Console output
	log.Println("🥤 Proxy Server listening on http://localhost" + port)

	err := http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal("Error starting proxy server: ", err)
	}
}
