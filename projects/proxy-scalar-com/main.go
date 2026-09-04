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

// isZeros reports whether every byte in b is zero.
func isZeros(b []byte) bool {
	for _, x := range b {
		if x != 0 {
			return false
		}
	}

	return true
}

// embeddedIPv4s returns any IPv4 addresses hidden inside an IPv6 transition
// address (6to4, NAT64, Teredo, or the deprecated IPv4-compatible format).
//
// These formats let an IPv6 literal encode an IPv4 destination, so an attacker
// could otherwise reach a blocked IPv4 range through an IPv6 address that never
// matches the IPv4 CIDRs. For example 2002:a9fe:a9fe:: is the 6to4 form of
// 169.254.169.254 and 64:ff9b::a9fe:a9fe is the NAT64 form. We decode the
// embedded IPv4 so it can be checked against the blocklist too.
func embeddedIPv4s(ip net.IP) []net.IP {
	ip16 := ip.To16()

	// Only IPv6 addresses can embed an IPv4 one. IPv4 and IPv4-mapped IPv6
	// (::ffff:x.x.x.x) are already normalized by the caller via To4().
	if ip16 == nil || ip.To4() != nil {
		return nil
	}

	var embedded []net.IP

	// 6to4: 2002:V4ADDR::/16, IPv4 in bytes 2-5.
	if ip16[0] == 0x20 && ip16[1] == 0x02 {
		embedded = append(embedded, net.IPv4(ip16[2], ip16[3], ip16[4], ip16[5]))
	}

	// NAT64 well-known prefix 64:ff9b::/96, IPv4 in the last 4 bytes.
	if ip16[0] == 0x00 && ip16[1] == 0x64 && ip16[2] == 0xff && ip16[3] == 0x9b {
		embedded = append(embedded, net.IPv4(ip16[12], ip16[13], ip16[14], ip16[15]))
	}

	// Teredo 2001:0000::/32: server IPv4 in bytes 4-7, client IPv4 in the last
	// 4 bytes obfuscated by XOR with all ones.
	if ip16[0] == 0x20 && ip16[1] == 0x01 && ip16[2] == 0x00 && ip16[3] == 0x00 {
		embedded = append(embedded, net.IPv4(ip16[4], ip16[5], ip16[6], ip16[7]))
		embedded = append(embedded, net.IPv4(ip16[12]^0xff, ip16[13]^0xff, ip16[14]^0xff, ip16[15]^0xff))
	}

	// IPv4-compatible ::/96 (deprecated): first 12 bytes zero, IPv4 in the last
	// 4. The all-zero and loopback addresses are covered by their own CIDRs.
	if isZeros(ip16[0:12]) {
		embedded = append(embedded, net.IPv4(ip16[12], ip16[13], ip16[14], ip16[15]))
	}

	return embedded
}

// ipIsBlocked reports whether an IP falls in a blocked range. It also decodes
// any IPv4 address embedded in an IPv6 transition address and checks that too,
// so those formats cannot be used to reach a blocked IPv4 range.
func ipIsBlocked(ip net.IP) bool {
	// Normalize IPv4-mapped IPv6 (e.g. ::ffff:169.254.169.254)
	if v4 := ip.To4(); v4 != nil {
		ip = v4
	}

	candidates := append([]net.IP{ip}, embeddedIPv4s(ip)...)

	for _, candidate := range candidates {
		for _, network := range blockedCIDRs {
			if network.Contains(candidate) {
				return true
			}
		}
	}

	return false
}

// dialAddr formats an IP and port for dialing, wrapping IPv6 in brackets.
func dialAddr(ip net.IP, port string) string {
	if v4 := ip.To4(); v4 != nil {
		return fmt.Sprintf("%s:%s", v4.String(), port)
	}

	return fmt.Sprintf("[%s]:%s", ip.String(), port)
}

// isCredentialHeader reports whether a header carries credentials that must not
// be forwarded to a different host during a redirect.
func isCredentialHeader(header string) bool {
	switch strings.ToLower(header) {
	case "authorization", "proxy-authorization", "cookie":
		return true
	default:
		return false
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
		return ipIsBlocked(ip)
	}

	// Otherwise resolve via DNS
	ips, err := net.LookupIP(h)

	if err != nil {
		// On DNS errors, block
		return true
	}

	for _, ip := range ips {
		if ipIsBlocked(ip) {
			return true
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

type forbiddenHeaderRewrite struct {
	header       string
	scalarHeader string
}

type proxyValidationError struct {
	statusCode int
	message    string
}

var forbiddenHeadersForProxy = []forbiddenHeaderRewrite{
	{header: "date", scalarHeader: "x-scalar-date"},
	{header: "dnt", scalarHeader: "x-scalar-dnt"},
	{header: "referer", scalarHeader: "x-scalar-referer"},
	{header: "user-agent", scalarHeader: "x-scalar-user-agent"},
}

var scalarURLValidationErrors = []proxyValidationError{
	{
		statusCode: http.StatusBadRequest,
		message:    "Bad Request: The `scalar_url` query parameter is required. Try to add `?scalar_url=https%3A%2F%2Fgalaxy.scalar.com%2Fplanets` to the URL.",
	},
	{
		statusCode: http.StatusBadRequest,
		message:    "Bad Request: The `scalar_url` query parameter must be an absolute URL. Relative URLs like `/foobar` are not supported.",
	},
	{
		statusCode: http.StatusForbidden,
		message:    "Forbidden: Access to private addresses is not allowed. Please use a public domain name.",
	},
}

type streamingResponseWriter struct {
	writer  http.ResponseWriter
	flusher http.Flusher
}

func (s streamingResponseWriter) Write(p []byte) (int, error) {
	n, err := s.writer.Write(p)

	if err == nil {
		s.flusher.Flush()
	}

	return n, err
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
					if ipIsBlocked(ip) {
						return nil, fmt.Errorf("dial to blocked IP %s", ip.String())
					}

					return dialer.DialContext(ctx, network, dialAddr(ip, port))
				}

				// Re-resolve hostname on every dial
				ips, err := net.LookupIP(host)

				if err != nil {
					return nil, err
				}

				// Check all returned IPs against blocked ranges
				for _, ip := range ips {
					if ipIsBlocked(ip) {
						return nil, fmt.Errorf("dial to blocked IP %s", ip.String())
					}
				}

				// Pick the first allowed IP to dial
				if len(ips) > 0 {
					return dialer.DialContext(ctx, network, dialAddr(ips[0], port))
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

	remote, validationErrors := ps.validateScalarURL(target)
	if len(validationErrors) > 0 {
		firstError := validationErrors[0]
		http.Error(w, firstError.message, firstError.statusCode)
		return
	}

	// Create and execute the proxy request
	if err := ps.executeProxyRequest(w, r, remote, target); err != nil {
		// Log any errors
		log.Printf("[Proxy Error:] %v\n", err)
	}
}

func (ps *ProxyServer) validateScalarURL(target string) (*url.URL, []proxyValidationError) {
	errors := []proxyValidationError{}

	if target == "" {
		errors = append(errors, scalarURLValidationErrors[0])
		return nil, errors
	}

	remote, err := url.Parse(target)
	if err != nil {
		errors = append(errors, proxyValidationError{
			statusCode: http.StatusServiceUnavailable,
			message:    err.Error(),
		})

		return nil, errors
	}

	if !remote.IsAbs() || remote.Host == "" {
		errors = append(errors, scalarURLValidationErrors[1])
		return nil, errors
	}

	// Deny any private, link-local, or loopback addresses
	if !ps.bypassCidr && isBlockedHost(remote.Host) {
		errors = append(errors, scalarURLValidationErrors[2])
		return nil, errors
	}

	return remote, errors
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
			// and other important headers through redirect chains. When the
			// redirect points at a different host, credential headers are
			// dropped so a target that redirects to an attacker-controlled host
			// cannot collect the user's Authorization, Cookie, or
			// Proxy-Authorization headers.
			original := via[0]
			sameHost := strings.EqualFold(req.URL.Hostname(), original.URL.Hostname())

			for key, values := range original.Header {
				if !sameHost && isCredentialHeader(key) {
					continue
				}

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

	// Copy the headers but exclude Origin and Cookie.
	// Origin is not required and might confuse some target servers.
	// Cookies are excluded by default so browser cookies are not leaked;
	// users need to specifically set cookies via X-Scalar-Cookie.
	for key, values := range r.Header {
		lowerKey := strings.ToLower(key)
		if lowerKey != "origin" && lowerKey != "cookie" {
			outreq.Header[key] = values
		}
	}

	// Users need to specifically set their cookies in X-Scalar-Cookie
	if xScalarCookie := r.Header.Get("X-Scalar-Cookie"); xScalarCookie != "" {
		outreq.Header.Set("Cookie", xScalarCookie)
	}
	// Remove the X-Scalar-Cookie header
	outreq.Header.Del("X-Scalar-Cookie")

	// Browsers strip some forbidden headers from outgoing requests.
	// For a small allowlist, users can send `X-Scalar-*` and we forward the corresponding header.
	for _, forbiddenHeader := range forbiddenHeadersForProxy {
		if scalarHeaderValue := r.Header.Get(forbiddenHeader.scalarHeader); scalarHeaderValue != "" {
			outreq.Header.Set(forbiddenHeader.header, scalarHeaderValue)
			outreq.Header.Del(forbiddenHeader.scalarHeader)
		}
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

	// Mirror all Set-Cookie values into x-scalar-set-cookie so browser clients can
	// read them. Browsers hide Set-Cookie from fetch() for cross-origin responses
	// (even with Access-Control-Expose-Headers), so the API client relies on this
	// custom header to surface server-set cookies like a Django csrftoken.
	if setCookies := resp.Header.Values("Set-Cookie"); len(setCookies) > 0 {
		w.Header().Set("X-Scalar-Set-Cookie", strings.Join(setCookies, ", "))
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

	responseWriter := io.Writer(w)
	contentType := strings.ToLower(resp.Header.Get("Content-Type"))

	// SSE streams require chunk flushing to deliver events progressively.
	if strings.HasPrefix(contentType, "text/event-stream") {
		if flusher, ok := w.(http.Flusher); ok {
			flusher.Flush()
			responseWriter = streamingResponseWriter{
				writer:  w,
				flusher: flusher,
			}
		}
	}

	// Copy the body
	if _, err := io.Copy(responseWriter, resp.Body); err != nil {
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
