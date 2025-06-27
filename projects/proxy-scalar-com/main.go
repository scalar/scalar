package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

// Blocked network CIDRs: loopback, link-local, private, CGNAT, local IPv6
var blockedCIDRs []*net.IPNet

func init() {
	// Prevent unwanted traffic forwarding for the following
	cidrs := []string{
		"0.0.0.0/32",
		"127.0.0.0/8",
		"::1/128",
		"::/128",
		"169.254.0.0/16",
		"fe80::/10",
		"10.0.0.0/8",
		"172.16.0.0/12",
		"192.168.0.0/16",
		"100.64.0.0/10",
		"fc00::/7",
	}

	for _, cidr := range cidrs {
		_, network, err := net.ParseCIDR(cidr)

		if err != nil {
			log.Fatalf("Invalid CIDR %s: %v", cidr, err)
		}

		blockedCIDRs = append(blockedCIDRs, network)
	}
}

// Check if a given hostname or IP resolves to any blocked CIDR
func isBlockedHost(host string) bool {
	// Strip port if present
	h := host

	if hostOnly, _, err := net.SplitHostPort(host); err == nil {
		h = hostOnly
	}

	// Try to parse literal IP first
	if ip := net.ParseIP(h); ip != nil {
		// Normalize IPv4-mapped IPv6 (e.g. ::ffff:169.254.169.254)
		if v4 := ip.To4(); v4 != nil {
			ip = v4
		}

		for _, network := range blockedCIDRs {
			if network.Contains(ip) {
				return true
			}
		}

		return false
	}

	// Otherwise resolve via DNS
	ips, err := net.LookupIP(h)

	if err != nil {
		// On DNS errors, block
		return true
	}

	for _, ip := range ips {
		// Normalize IPv4-mapped IPv6
		if v4 := ip.To4(); v4 != nil {
			ip = v4
		}

		for _, network := range blockedCIDRs {
			if network.Contains(ip) {
				return true
			}
		}
	}

	return false
}

// Set up and start the proxy server. The server is designed to bypass CORS and make cross-origin requests in browsers
// behave like server-side requests (or let's say like `curl`).
func main() {
	// The default port
	port := ":1337"

	// Allow to overwrite the port with an environment variable
	if p := os.Getenv("PORT"); p != "" {
		port = ":" + p
	}

	// Create a new proxy server instance
	proxyServer := NewProxyServer(os.Getenv("ENV") == "dev")

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
	transport  *http.Transport
	bypassCidr bool
}

// NewProxyServer creates a new proxy server instance
func NewProxyServer(bypassCidr bool) *ProxyServer {
	dialer := &net.Dialer{Timeout: 10 * time.Second}

	return &ProxyServer{
		bypassCidr: bypassCidr,
		transport: &http.Transport{
			// Skip TLS verification. This is useful for development environments
			// where the target API might use self-signed certificates.
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
			// Handle custom dial for cidr checks
			DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
				host, port, _ := net.SplitHostPort(addr)

				// If bypassCidr is true, skip CIDR checks
				if bypassCidr {
					return dialer.DialContext(ctx, network, addr)
				}

				// Try to parse literal IP first
				if ip := net.ParseIP(host); ip != nil {
					// Normalize IPv4-mapped IPv6
					if v4 := ip.To4(); v4 != nil {
						ip = v4
					}

					for _, block := range blockedCIDRs {
						if block.Contains(ip) {
							return nil, fmt.Errorf("dial to blocked IP %s", ip.String())
						}
					}

					// Format chosen with brackets if IPv6
					var chosen string
					if ip.To4() == nil {
						chosen = fmt.Sprintf("[%s]:%s", ip.String(), port)
					} else {
						chosen = fmt.Sprintf("%s:%s", ip.String(), port)
					}

					return dialer.DialContext(ctx, network, chosen)
				}

				// Re-resolve hostname on every dial
				ips, err := net.LookupIP(host)

				if err != nil {
					return nil, err
				}

				// Check all returned IPs against blocked ranges
				for _, ip := range ips {
					if v4 := ip.To4(); v4 != nil {
						ip = v4
					}

					for _, block := range blockedCIDRs {
						if block.Contains(ip) {
							return nil, fmt.Errorf("dial to blocked IP %s", ip.String())
						}
					}
				}

				// Pick the first allowed IP to dial
				if len(ips) > 0 {
					ip := ips[0]

					if v4 := ip.To4(); v4 != nil {
						ip = v4
					}

					// Format with brackets if IPv6
					var chosen string
					if ip.To4() == nil {
						chosen = fmt.Sprintf("[%s]:%s", ip.String(), port)
					} else {
						chosen = fmt.Sprintf("%s:%s", ip.String(), port)
					}

					return dialer.DialContext(ctx, network, chosen)
				}

				return nil, fmt.Errorf("no IPs to dial for host %s", host)
			},
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

	// Deny any private, link-local, or loopback addresses
	if !ps.bypassCidr && isBlockedHost(remote.Host) {
		http.Error(w, "Forbidden: access to private addresses is not allowed", http.StatusForbidden)
		return
	}

	// Create and execute the proxy request
	if err := ps.executeProxyRequest(w, r, remote, target); err != nil {
		// Log any errors
		log.Printf("[Proxy Error:] %v\n", err)
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
			// Handle private CIDR check again on redirect
			if !ps.bypassCidr && isBlockedHost(req.URL.Host) {
				return fmt.Errorf("redirect to blocked host: %s", req.URL.Host)
			}

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

	// Copy the headers but exclude Origin. It's not required and might confuse some target servers.
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
	w.Header().Set("Access-Control-Allow-Headers", "*")
	w.Header().Set("Access-Control-Allow-Origin", "*")
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

		w.Header().Set("Access-Control-Allow-Origin", "*")
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
