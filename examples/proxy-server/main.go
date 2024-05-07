package main

import (
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
	target := queryValues.Get("url")

	// we can eventually do a check on the type of request
	// i.e. websocket vs mqtt vs grpc
	// but let's handle just http for now :)

	proxyUrl, _ := url.Parse(target)

	// Create a reverse proxy
	proxy := httputil.NewSingleHostReverseProxy(proxyUrl)

	// Modify the request to indicate it is proxied
	r.URL.Host = proxyUrl.Host
	r.URL.Scheme = proxyUrl.Scheme
	r.Header.Set("X-Forwarded-Host", r.Header.Get("Host"))
	r.Host = proxyUrl.Host

	// ServeHttp uses the given ResponseWriter and Request to do the proxying
	proxy.ServeHTTP(w, r)
}

func main() {
	port := ":1337"
	if p := os.Getenv("PORT"); p != "" {
		port = ":" + os.Getenv("PORT")
	}

	http.HandleFunc("/", handleRequest)

	log.Println("Starting proxy server on", port)

	err := http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal("Error starting proxy server: ", err)
	}
}
