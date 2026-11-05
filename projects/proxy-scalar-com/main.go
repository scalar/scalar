package main

import (
	"bytes"
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"sync/atomic"
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
		// Local NAT64 prefixes can encode private IPv4 at several offsets.
		"64:ff9b:1::/48",
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
	if ip16[0] == 0x00 && ip16[1] == 0x64 && ip16[2] == 0xff && ip16[3] == 0x9b && isZeros(ip16[4:12]) {
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

// sameOrigin requires the same scheme, hostname, and effective port before
// following a redirect. Arbitrary headers and request bodies can carry secrets,
// so a list of known credential headers cannot safely authorize another origin.
func sameOrigin(initial, destination *url.URL) bool {
	effectivePort := func(u *url.URL) string {
		if port := u.Port(); port != "" {
			return port
		}
		switch strings.ToLower(u.Scheme) {
		case "http":
			return "80"
		case "https":
			return "443"
		default:
			return ""
		}
	}
	return strings.EqualFold(initial.Scheme, destination.Scheme) &&
		strings.EqualFold(initial.Hostname(), destination.Hostname()) &&
		effectivePort(initial) == effectivePort(destination)
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
	if err := newHTTPServer(port, handler).ListenAndServe(); err != nil {
		log.Fatal("⚠️ Error starting the Proxy Server: ", err)
	}
}

// newHTTPServer builds the incoming HTTP listener configuration.
func newHTTPServer(address string, handler http.Handler) *http.Server {
	// Whole-request read/write deadlines would interrupt uploads and SSE.
	return &http.Server{
		Addr:              address,
		Handler:           incomingBodyTimeout(handler, 60*time.Second),
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
}

// Refresh the read deadline only while consuming the upload. Clearing it after
// each read keeps response streaming and upstream backpressure unrestricted.
type idleRequestBody struct {
	io.ReadCloser
	controller *http.ResponseController
	idle       time.Duration
}

func (body *idleRequestBody) Read(buffer []byte) (int, error) {
	if err := body.controller.SetReadDeadline(time.Now().Add(body.idle)); err != nil && !errors.Is(err, http.ErrNotSupported) {
		return 0, err
	}
	defer body.controller.SetReadDeadline(time.Time{})
	return body.ReadCloser.Read(buffer)
}

func incomingBodyTimeout(next http.Handler, idle time.Duration) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Body != nil && r.Body != http.NoBody {
			r.Body = &idleRequestBody{ReadCloser: r.Body, controller: http.NewResponseController(w), idle: idle}
		}
		next.ServeHTTP(w, r)
	})
}

// ProxyServer encapsulates the proxy server configuration and handlers.
//
// It uses a custom transport to handle HTTPS connections, including those
// with self-signed certificates for development environments.
type ProxyServer struct {
	transport  *http.Transport
	bypassCidr bool
	// bufferedBodyBytes counts the request body bytes held in memory right now.
	bufferedBodyBytes atomic.Int64
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

	// The answer depends on how the browser loads the URL, so a shared cache
	// must not serve a response to a fetch() for a page load, or the other way
	// around.
	w.Header().Add("Vary", "Sec-Fetch-Mode, Sec-Fetch-Dest")

	// Before document requests were refused, a page on the proxy origin could
	// register any proxied script as a service worker. A worker like that answers
	// navigations itself, so the checks below never see them. Refusing its update
	// check would keep it installed, so replace it with one that removes itself.
	if isServiceWorkerRequest(r) {
		w.Header().Set("Content-Type", "text/javascript")
		// Old upstreams could grant root scope to scripts under any path.
		w.Header().Set("Service-Worker-Allowed", "/")
		w.Header().Set("Cache-Control", "no-store")
		w.Write([]byte(unregisterServiceWorkerScript))
		return
	}

	// Only programmatic requests (fetch, XHR) are proxied. Opening a proxy URL as
	// a page would render attacker-controlled content on the proxy origin.
	if isDocumentRequest(r) {
		http.Error(w, documentRequestError, http.StatusForbidden)
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
		// Error strings can contain credential-bearing URLs or upstream data.
		log.Printf("[Proxy Error:] %s\n", proxyErrorCategory(err))
	}
}

// proxyErrorCategory keeps operational diagnostics without logging untrusted
// error text, including URLs embedded in wrapped errors or redirect failures.
func proxyErrorCategory(err error) string {
	if errors.Is(err, context.Canceled) {
		return "request canceled"
	}
	var networkError net.Error
	if errors.Is(err, context.DeadlineExceeded) || (errors.As(err, &networkError) && networkError.Timeout()) {
		return "upstream timeout"
	}
	var dnsError *net.DNSError
	if errors.As(err, &dnsError) {
		return "DNS failure"
	}
	var connectionError *net.OpError
	if errors.As(err, &connectionError) {
		return "network failure"
	}
	return "request failed"
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

// redirectReplayTransport leaves replay decisions to CheckRedirect. The transport
// must not use a placeholder replay body to retry a failed connection, where no
// redirect callback would get a chance to reject the incomplete upload.
type redirectReplayTransport struct {
	transport *http.Transport
}

func (t redirectReplayTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	outbound := req.Clone(req.Context())
	outbound.GetBody = nil
	return t.transport.RoundTrip(outbound)
}

// executeProxyRequest handles the proxying logic
//
//  1. Forwards the request headers, except Origin, Cookie (sent through
//     X-Scalar-Cookie instead) and headers the browser adds for the proxy origin
//  2. Follows same-origin redirects and maintains session state through them
//  3. Passes on the upstream response, minus headers that would act on the
//     proxy origin (see untrustedResponseHeaders), with consistent CORS headers
//  4. Tracks the final URL after any redirects
func (ps *ProxyServer) executeProxyRequest(w http.ResponseWriter, r *http.Request, remote *url.URL, target string) error {
	// HTTP/1 otherwise drains the incoming upload before writing a response.
	// HTTP/2 already permits concurrent reads and writes.
	controller := http.NewResponseController(w)
	_ = controller.EnableFullDuplex()

	client := &http.Client{
		Transport: redirectReplayTransport{transport: ps.transport},
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			// Handle private CIDR check again on redirect
			if !ps.bypassCidr && isBlockedHost(req.URL.Host) {
				return fmt.Errorf("redirect to blocked host: %s", req.URL.Host)
			}

			if len(via) >= 10 {
				return fmt.Errorf("stopped after 10 redirects")
			}

			// Returning the redirect response itself would let the browser
			// follow its Location with custom credential headers. Reject it
			// instead, before any request reaches the other origin.
			if !sameOrigin(via[0].URL, req.URL) {
				return fmt.Errorf("redirect to a different origin is not allowed")
			}

			// GetBody returns NoBody when the upload is incomplete or exceeds the
			// replay budget. Do not send that placeholder to the redirect target.
			if req.Body == http.NoBody {
				return http.ErrUseLastResponse
			}

			// Go can strip credentials when only hostname casing changes.
			// Restore missing credentials from the preceding trusted hop,
			// preserving Go's cookie updates and method-specific body headers.
			for _, header := range []string{"Authorization", "Proxy-Authorization", "Cookie", "Cookie2", "Www-Authenticate", "Proxy-Authenticate"} {
				if _, present := req.Header[header]; !present {
					if values, exists := via[len(via)-1].Header[header]; exists {
						req.Header[header] = append([]string(nil), values...)
					}
				}
			}

			return nil
		},
	}

	// Retain a replay copy while the transport consumes the upload. Waiting for the
	// complete upload here would stall streaming APIs and early responses.
	body, releaseBody := ps.replayableBody(r.Body, r.ContentLength)
	body.interruptRead = func() {
		// Go closes the initial body before checking a redirect. Interrupt an
		// unfinished HTTP/1 read so Close does not wait for the client to finish.
		if r.ProtoMajor == 1 {
			_ = controller.SetReadDeadline(time.Now())
		}
	}
	defer releaseBody()
	// The transport closes outbound bodies, and the server owns the incoming
	// body. Closing it here can block behind a Read on an unfinished upload
	// before the server has flushed the early response.

	outreq, err := http.NewRequest(r.Method, target, body)
	if err != nil {
		http.Error(w, proxyErrorCategory(err), http.StatusInternalServerError)
		return err
	}
	outreq.ContentLength = r.ContentLength
	outreq.GetBody = body.getBody
	if r.Body == nil || r.Body == http.NoBody {
		outreq.Body = http.NoBody
		outreq.GetBody = nil
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

	// The browser advertises compression dictionaries it stored for the proxy
	// origin. Those came from whichever API set them, so they must not be sent
	// to every other API called through the proxy.
	outreq.Header.Del("Available-Dictionary")
	outreq.Header.Del("Dictionary-Id")

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

	// Redirects are done, so discard the replay copy. If the transport is still
	// uploading, its reader keeps the bytes counted until it closes the body.
	releaseBody()

	if err != nil {
		http.Error(w, proxyErrorCategory(err), http.StatusServiceUnavailable)
		return err
	}

	// Close response body when done to prevent resource leaks
	defer resp.Body.Close()

	redirectLocation := ""

	// A 3xx reaches this point when Go did not follow it: a 300, or a 307/308
	// whose request body was too large to replay. Reject cross-origin Locations
	// here too, so the response never points the client outside the proxy's
	// origin policy.
	if resp.StatusCode >= 300 && resp.StatusCode < 400 && len(resp.Header.Values("Location")) > 0 {
		// Header.Get only looks at the first value. An empty first value followed
		// by a real one would skip this check, so look at all of them.
		locations := []string{}
		for _, location := range resp.Header.Values("Location") {
			if strings.TrimSpace(location) != "" {
				locations = append(locations, location)
			}
		}

		if len(locations) > 1 {
			err := fmt.Errorf("redirect with more than one Location is not allowed")
			http.Error(w, proxyErrorCategory(err), http.StatusServiceUnavailable)
			return err
		}

		if len(locations) == 1 {
			destination, err := resp.Request.URL.Parse(locations[0])
			if err != nil {
				err := fmt.Errorf("redirect with an invalid Location is not allowed: %v", err)
				http.Error(w, proxyErrorCategory(err), http.StatusServiceUnavailable)
				return err
			}

			if !sameOrigin(remote, destination) {
				err := fmt.Errorf("redirect to a different origin is not allowed")
				http.Error(w, proxyErrorCategory(err), http.StatusServiceUnavailable)
				return err
			}

			redirectLocation = destination.String()
		}

		// The upstream picked the target, so letting the browser follow it
		// would be an open redirect for browsers that do not send Sec-Fetch-*
		// headers. Pass on the absolute URL we validated as
		// X-Scalar-Original-Location instead, which the API client shows as
		// Location. That also avoids parser differences: Go resolves
		// `/\attacker.example/` to a path on the upstream host, while browsers
		// treat the backslash as a slash.
		resp.Header.Del("Location")
	}

	// Copy headers from final response, but skip CORS headers and headers the
	// browser would act on for the proxy origin (see untrustedResponseHeaders).
	for key, values := range resp.Header {

		// Check if header is a CORS headers
		isCorsHeader := func(header string) bool {
			return strings.HasPrefix(strings.ToLower(header), "access-control-")
		}

		if isCorsHeader(key) || isUntrustedResponseHeader(key) || isReservedProxyHeader(key) {
			continue
		}

		for _, value := range values {
			w.Header().Add(key, value)
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
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH, QUERY")
	w.Header().Set("Access-Control-Expose-Headers", "*")

	// Add the final URL as a header
	w.Header().Set("X-Forwarded-Host", resp.Request.URL.String())

	setUntrustedContentHeaders(w.Header(), resp.Header)

	if redirectLocation != "" {
		w.Header().Set("X-Scalar-Original-Location", redirectLocation)
	}

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

// untrustedContentSecurityPolicy keeps proxied documents inert when a browser
// renders them anyway, for example one that does not send Sec-Fetch-* headers.
//
// `sandbox` gives the document an opaque origin and blocks scripts, forms,
// popups, and `<meta>` refresh. `default-src 'none'` blocks scripts and
// subresources in its own right. `base-uri` and `form-action` do not fall back
// to `default-src`, so they are listed explicitly. It does not stop a user from
// clicking a plain link, and it does not cover the HTTP `Refresh` header, which
// is removed separately.
const untrustedContentSecurityPolicy = "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; sandbox"

const documentRequestError = "Forbidden: The proxy only handles requests made with fetch() or XMLHttpRequest. It does not serve pages to open in the browser."

// unregisterServiceWorkerScript removes the service worker that is being updated.
const unregisterServiceWorkerScript = "self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.registration.unregister()));"

// isServiceWorkerRequest reports whether the browser is fetching a service worker
// script. Browsers only register same-origin scripts, so this is an update check
// for a worker registered earlier. New pages cannot register one, because the
// proxy no longer serves them.
func isServiceWorkerRequest(r *http.Request) bool {
	return strings.EqualFold(r.Header.Get("Sec-Fetch-Dest"), "serviceworker")
}

// isDocumentRequest reports whether the browser is loading the proxy URL as a
// page (a link, a redirect, a form submission, or an iframe) rather than
// reading it with fetch() or XMLHttpRequest.
//
// The API client only reads the proxy programmatically, so refusing these
// requests costs nothing and stops attackers from using the proxy origin to
// host pages, run scripts, redirect visitors, set cookies, or serve downloads.
// Non-browser clients (curl, servers) do not send these headers and are not
// affected.
func isDocumentRequest(r *http.Request) bool {
	switch strings.ToLower(r.Header.Get("Sec-Fetch-Mode")) {
	// Chrome 76 to 79 sent `nested-navigate` for iframes
	case "navigate", "nested-navigate":
		return true
	}

	switch strings.ToLower(r.Header.Get("Sec-Fetch-Dest")) {
	case "document", "iframe", "frame", "embed", "object", "fencedframe":
		return true
	// Workers run with the origin of their script URL. Browsers only allow
	// same-origin worker scripts, so this only matters if the proxy origin were
	// compromised another way, but there is no reason to serve them.
	case "worker", "sharedworker":
		return true
	}

	return false
}

// untrustedResponseHeaders are upstream headers that browsers act on for the
// proxy origin, whatever the response body is, and that the API client does
// not need to receive as-is:
//
//   - Refresh redirects the page, even when it is sandboxed (open redirect)
//   - Clear-Site-Data wipes the proxy origin's storage
//   - Set-Cookie can set cookies on the proxy host or its parent domain.
//     fetch() never exposes it, so the API client reads X-Scalar-Set-Cookie.
//   - Content-Security-Policy(-Report-Only) would sit next to our own policy.
//     Per the HTML spec only the last `sandbox` directive applies, and report
//     endpoints would still be pinged.
//   - X-Content-Type-Options is replaced with our own `nosniff`.
//
// Browsers also apply these to the proxy origin from fetch() responses:
//
//   - NEL, Report-To, and Reporting-Endpoints would have the browser report
//     later proxy requests, including their `scalar_url`, to the attacker
//   - Strict-Transport-Security and Alt-Svc change how the browser connects
//     to the proxy
//   - No-Vary-Search makes the browser cache ignore the query string. Every
//     proxied URL is `/?scalar_url=...`, so one API could answer for all others.
//   - Use-As-Dictionary stores the response as a compression dictionary for
//     the proxy origin. The browser then sends its hash and an ID the upstream
//     picked on later proxy requests, which works like a cookie.
//   - Cache-Control is replaced with a private one (see privateCacheControl),
//     and CDN-specific cache headers are dropped, so shared caches never store
//     a response that may depend on the caller's credentials
//   - X-Accel-*, X-Sendfile, and X-Lighttpd-Send-File tell a front server
//     (nginx, Apache, lighttpd) to serve a local file or internal location
//     instead of the response. proxy.scalar.com runs on Cloud Run with nothing
//     in front (see cloudbuild.yaml), but self-hosted proxies may sit behind
//     one of these.
//   - Set-Login, Observe-Browsing-Topics, Activate-Storage-Access, and the
//     prefixes below record state or grant access for the proxy origin
//   - Speculation-Rules makes Chromium fetch a rule set from any URL when it
//     renders the response, which neither `sandbox` nor `default-src` stops
var untrustedResponseHeaders = []string{
	"Refresh",
	"Clear-Site-Data",
	"Set-Cookie",
	"Content-Security-Policy",
	"Content-Security-Policy-Report-Only",
	"X-Content-Type-Options",
	"Nel",
	"Report-To",
	"Reporting-Endpoints",
	"Strict-Transport-Security",
	"Alt-Svc",
	"No-Vary-Search",
	"Use-As-Dictionary",
	"Cache-Control",
	"Cdn-Cache-Control",
	"Surrogate-Control",
	"Edge-Control",
	"X-Sendfile",
	"X-Lighttpd-Send-File",
	"Set-Login",
	"Observe-Browsing-Topics",
	"Activate-Storage-Access",
	"Speculation-Rules",
}

// untrustedResponseHeaderPrefixes cover header families that browsers keep
// adding to. A blocklist of single names keeps missing new members.
var untrustedResponseHeaderPrefixes = []string{
	// Attribution-Reporting-Register-Source, -Trigger, -OS-Source, ...
	"Attribution-Reporting-",
	// Ad-Auction-Signals, Ad-Auction-Allowed, Ad-Auction-Additional-Bid, ...
	"Ad-Auction-",
	// Sec-Session-Registration, Sec-Private-State-Token, ... Servers do not
	// send `Sec-` headers to describe their API, only to talk to browsers.
	"Sec-",
	// Device-bound session credentials
	"Secure-Session-",
	"Shared-Storage-",
	// X-Accel-Redirect, X-Accel-Expires, ... for nginx in front of the proxy
	"X-Accel-",
}

// proxyModifiedHeaders are headers the proxy sets itself. Listing them in
// X-Scalar-Modified-Headers lets the API client hide the proxy's values, and it
// restores the upstream values from X-Scalar-Original-* (see normalizeHeaders
// in @scalar/helpers).
var proxyModifiedHeaders = []string{
	"Cache-Control",
	"Content-Security-Policy",
	"Vary",
	"X-Content-Type-Options",
}

func isUntrustedResponseHeader(key string) bool {
	for _, header := range untrustedResponseHeaders {
		if strings.EqualFold(key, header) {
			return true
		}
	}

	for _, prefix := range untrustedResponseHeaderPrefixes {
		if len(key) >= len(prefix) && strings.EqualFold(key[:len(prefix)], prefix) {
			return true
		}
	}

	// Cloudflare-CDN-Cache-Control and similar per-CDN variants
	return len(key) >= len("-Cdn-Cache-Control") && strings.EqualFold(key[len(key)-len("-Cdn-Cache-Control"):], "-Cdn-Cache-Control")
}

// isReservedProxyHeader reports whether an upstream header uses a name the
// proxy uses to talk to the API client. The upstream could otherwise hide or
// fake the headers the client shows, or send a name the client cannot handle.
func isReservedProxyHeader(key string) bool {
	return strings.EqualFold(key, "X-Scalar-Modified-Headers") ||
		strings.EqualFold(key, "X-Scalar-Set-Cookie") ||
		(len(key) >= len("X-Scalar-Original-") && strings.EqualFold(key[:len("X-Scalar-Original-")], "X-Scalar-Original-"))
}

// privateCacheControl keeps the upstream's caching directives for the browser,
// but marks the response private so shared caches (a CDN in front of the proxy)
// never store it. Shared caches key on the URL only, not on the Authorization
// or X-Scalar-Cookie headers the request was made with.
func privateCacheControl(upstream []string) string {
	directives := []string{"private"}

	for _, value := range upstream {
		for _, directive := range splitDirectives(value) {
			name := strings.ToLower(strings.TrimSpace(strings.SplitN(directive, "=", 2)[0]))

			switch name {
			case "", "public", "private", "s-maxage", "proxy-revalidate":
				continue
			}

			directives = append(directives, directive)
		}
	}

	return strings.Join(directives, ", ")
}

// splitDirectives splits a Cache-Control value on commas outside quoted
// strings, so `private="Set-Cookie, X-Foo", max-age=60` stays two directives.
func splitDirectives(value string) []string {
	directives := []string{}
	start := 0
	quoted := false
	escaped := false

	for i, char := range value {
		switch {
		case escaped:
			escaped = false
		case quoted && char == '\\':
			escaped = true
		case char == '"':
			quoted = !quoted
		case char == ',' && !quoted:
			if directive := strings.TrimSpace(value[start:i]); directive != "" {
				directives = append(directives, directive)
			}
			start = i + 1
		}
	}

	if directive := strings.TrimSpace(value[start:]); directive != "" {
		directives = append(directives, directive)
	}

	return directives
}

// maxReplayableBodySize is how much of a request body the proxy buffers so Go
// can resend it when following a same-origin 307 or 308, like `curl -L`.
// All bodies stream immediately; incomplete or larger uploads cannot be replayed.
const maxReplayableBodySize = 10 << 20

// maxBufferedBodyBytes limits the memory all requests can hold in buffered bodies
// together. Without it, clients that send a body and then stall would each pin
// up to maxReplayableBodySize, without any authentication. Past the limit bodies
// are streamed, which costs no memory and only loses 307 and 308 replays. The
// process uses about three times this at saturation, because of the room the
// garbage collector leaves on top of the live heap.
const maxBufferedBodyBytes = 128 << 20

// bufferedBody owns the replay copy and counts readers still used by the transport.
// A response can arrive before an upload finishes, so releasing replay ownership
// alone must not return those bytes to the budget.
type bufferedBody struct {
	mu           sync.Mutex
	data         []byte
	readers      int
	released     bool
	complete     bool
	releaseBytes func()
}

func (b *bufferedBody) release() {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.releaseLocked()
}

func (b *bufferedBody) releaseLocked() {
	b.released = true
	b.data = nil
	if b.readers == 0 {
		b.releaseBytes()
	}
}

// bufferedBodyReader clears its own reference on Close, even if net/http keeps
// the request reachable for the lifetime of a streaming response.
type bufferedBodyReader struct {
	mu     sync.Mutex
	buffer *bufferedBody
	reader *bytes.Reader
}

func (r *bufferedBodyReader) Read(p []byte) (int, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.reader == nil {
		return 0, io.ErrClosedPipe
	}
	return r.reader.Read(p)
}

func (r *bufferedBodyReader) Close() error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.reader == nil {
		return nil
	}
	r.reader = nil
	r.buffer.mu.Lock()
	defer r.buffer.mu.Unlock()
	r.buffer.readers--
	if r.buffer.released && r.buffer.readers == 0 {
		r.buffer.releaseBytes()
	}
	return nil
}

// streamingReplayBody records bytes as they are consumed by the transport.
// Close must unblock Read, so the source is read outside the buffer mutex.
// Closing the initial upload keeps replay ownership until redirects finish.
type streamingReplayBody struct {
	source        io.ReadCloser
	buffer        *bufferedBody
	proxy         *ProxyServer
	length        int64
	held          int64
	consumed      int64
	finished      bool
	interruptRead func()
	closeOnce     sync.Once
	closeErr      error
}

func (r *streamingReplayBody) Read(p []byte) (int, error) {
	n, err := r.source.Read(p)
	r.buffer.mu.Lock()
	defer r.buffer.mu.Unlock()
	r.consumed += int64(n)
	r.finished = err != nil || (r.length > 0 && r.consumed == r.length)
	if r.buffer.released {
		return n, err
	}
	if (err != nil && err != io.EOF) || len(r.buffer.data)+n > maxReplayableBodySize {
		r.buffer.releaseLocked()
		return n, err
	}
	if r.proxy.bufferedBodyBytes.Add(int64(n)) > maxBufferedBodyBytes {
		r.proxy.bufferedBodyBytes.Add(-int64(n))
		r.buffer.releaseLocked()
		return n, err
	}
	r.held += int64(n)
	r.buffer.data = append(r.buffer.data, p[:n]...)
	// Known-length uploads may finish without a separate EOF read.
	r.buffer.complete = r.finished && (r.length <= 0 || r.consumed == r.length)
	return n, err
}

func (r *streamingReplayBody) Close() error {
	r.closeOnce.Do(func() {
		r.buffer.mu.Lock()
		finished := r.finished
		r.buffer.mu.Unlock()
		if !finished && r.interruptRead != nil {
			r.interruptRead()
		}
		r.closeErr = r.source.Close()
	})
	return r.closeErr
}

func (r *streamingReplayBody) getBody() (io.ReadCloser, error) {
	r.buffer.mu.Lock()
	defer r.buffer.mu.Unlock()
	if !r.buffer.complete || r.buffer.released {
		// net/http asks for the replay body before invoking CheckRedirect.
		// That callback recognizes this sentinel and returns the redirect as-is.
		return http.NoBody, nil
	}
	r.buffer.readers++
	return &bufferedBodyReader{buffer: r.buffer, reader: bytes.NewReader(r.buffer.data)}, nil
}

// replayableBody retains at most the per-request and shared budgets without
// reading ahead. The caller releases replay ownership after the redirect chain.
func (ps *ProxyServer) replayableBody(body io.ReadCloser, length int64) (*streamingReplayBody, func()) {
	if body == nil {
		body = http.NoBody
	}
	reader := &streamingReplayBody{source: body, proxy: ps, length: length}
	reader.buffer = &bufferedBody{releaseBytes: sync.OnceFunc(func() {
		ps.bufferedBodyBytes.Add(-reader.held)
	})}
	return reader, reader.buffer.release
}

// setUntrustedContentHeaders protects the proxy origin from proxied content.
//
// The proxy returns whatever the target URL responds with. Without these
// headers, anyone could link to `/?scalar_url=https://attacker.example/evil.svg`
// and the browser would render that SVG or HTML as a document on the proxy
// origin, running its scripts there. Document requests are already refused in
// handleRequest; this is the fallback for browsers that do not send
// Sec-Fetch-* headers.
//
// Browsers ignore CSP on responses read through fetch(), so the API client
// keeps working. When the upstream does not send a Content-Type, Go sniffs one
// before writing; `nosniff` cannot prevent that, which is one more reason the
// CSP applies to every response.
//
// Upstream values of the removed headers are passed on as X-Scalar-Original-*,
// which browsers ignore, so the API client can still show what the API sent.
func setUntrustedContentHeaders(header http.Header, upstream http.Header) {
	for key, values := range upstream {
		// Set-Cookie is already mirrored in X-Scalar-Set-Cookie
		if !isUntrustedResponseHeader(key) || strings.EqualFold(key, "Set-Cookie") {
			continue
		}

		header.Set("X-Scalar-Original-"+http.CanonicalHeaderKey(key), strings.Join(values, ", "))
	}

	// Vary is forwarded, because the browser cache needs it, but the proxy adds
	// its own values. Every modified header is hidden by the client, so pass on
	// what the upstream sent.
	for _, key := range proxyModifiedHeaders {
		if values := upstream.Values(key); len(values) > 0 {
			header.Set("X-Scalar-Original-"+key, strings.Join(values, ", "))
		}
	}

	header.Set("Cache-Control", privateCacheControl(upstream.Values("Cache-Control")))
	header.Set("Content-Security-Policy", untrustedContentSecurityPolicy)
	// Stop browsers from sniffing a mislabeled response into an active type
	header.Set("X-Content-Type-Options", "nosniff")
	header.Set("X-Scalar-Modified-Headers", strings.Join(proxyModifiedHeaders, ", "))
}

// Handle preflight requests and ensures browsers can access the proxy regardless of where the request originates from.
// This is essential to make cross-origin requests work in browser environments.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Headers", "*")

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH, QUERY")
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
