package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/http/httptrace"
	"net/url"
	"os"
	"strconv"
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

// timingsContextKeyType is a private type for the context key so it cannot
// collide with keys set elsewhere.
type timingsContextKeyType struct{}

// timingsContextKey carries the per-request proxyTimings through the request
// context so the custom DialContext can record the DNS lookup it performs.
var timingsContextKey = timingsContextKeyType{}

// proxyTimings collects the network phase durations for a single upstream
// request, measured from the proxy to the target server. These map to the
// phases a browser cannot observe for cross-origin requests, which is why we
// measure them here and report them back via the Server-Timing header.
type proxyTimings struct {
	// start marks the moment just before the outbound request is sent.
	start time.Time
	// dnsDuration is the time spent resolving the target hostname.
	dnsDuration time.Duration
	// connectDuration is the time spent establishing the TCP connection.
	connectDuration time.Duration
	// tlsDuration is the time spent on the TLS handshake.
	tlsDuration time.Duration
	// ttfb is the "waiting for server response" phase: the time from finishing
	// sending the request to receiving the first response byte. It excludes the
	// DNS, connect, and TLS phases so the phases can be shown side by side.
	ttfb time.Duration
	// reused reports whether an existing pooled connection was reused, in
	// which case the DNS, connect, and TLS phases legitimately did not happen.
	reused bool
}

// serverTimingHeader renders the collected timings as a Server-Timing header
// value. Browsers surface this natively and the Scalar API client parses it to
// draw a request timing waterfall. Only phases that actually happened are
// included, plus a reused marker so pooled connections are not misread.
func (t *proxyTimings) serverTimingHeader() string {
	// Format a duration as fractional milliseconds, matching the Server-Timing spec.
	ms := func(d time.Duration) string {
		return strconv.FormatFloat(float64(d.Microseconds())/1000.0, 'f', 2, 64)
	}

	parts := []string{}

	if t.dnsDuration > 0 {
		parts = append(parts, "dns;dur="+ms(t.dnsDuration))
	}

	if t.connectDuration > 0 {
		parts = append(parts, "connect;dur="+ms(t.connectDuration))
	}

	if t.tlsDuration > 0 {
		parts = append(parts, "tls;dur="+ms(t.tlsDuration))
	}

	if t.ttfb > 0 {
		parts = append(parts, "ttfb;dur="+ms(t.ttfb))
	}

	// A zero-duration description flag lets clients label reused connections.
	if t.reused {
		parts = append(parts, "reused")
	}

	return strings.Join(parts, ", ")
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

				// Re-resolve hostname on every dial. Time the lookup so we can
				// report it via Server-Timing. The custom DialContext resolves
				// manually, so httptrace's DNS hooks never fire for us.
				dnsStart := time.Now()
				ips, err := net.LookupIP(host)

				if timings, ok := ctx.Value(timingsContextKey).(*proxyTimings); ok {
					timings.dnsDuration = time.Since(dnsStart)
				}

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

	// Collect network phase timings (DNS, connect, TLS, TTFB) so we can report
	// them back to the client via Server-Timing. Browsers cannot observe these
	// for cross-origin requests, so measuring here is the only reliable source.
	timings := &proxyTimings{}

	var connectStart, tlsStart, wroteRequest time.Time

	trace := &httptrace.ClientTrace{
		GotConn: func(info httptrace.GotConnInfo) {
			// A reused connection skips DNS, connect, and TLS entirely.
			timings.reused = info.Reused
		},
		ConnectStart: func(_, _ string) {
			connectStart = time.Now()
		},
		ConnectDone: func(_, _ string, _ error) {
			if !connectStart.IsZero() {
				// Accumulate across redirects, which may dial more than once.
				timings.connectDuration += time.Since(connectStart)
			}
		},
		TLSHandshakeStart: func() {
			tlsStart = time.Now()
		},
		TLSHandshakeDone: func(_ tls.ConnectionState, _ error) {
			if !tlsStart.IsZero() {
				timings.tlsDuration += time.Since(tlsStart)
			}
		},
		WroteRequest: func(_ httptrace.WroteRequestInfo) {
			// Marks the end of sending the request; TTFB is measured from here.
			// The last write in a redirect chain wins, giving the final leg.
			wroteRequest = time.Now()
		},
		GotFirstResponseByte: func() {
			// Isolated "waiting for server response" phase for the final response.
			if !wroteRequest.IsZero() {
				timings.ttfb = time.Since(wroteRequest)
			} else {
				timings.ttfb = time.Since(timings.start)
			}
		},
	}

	ctx := httptrace.WithClientTrace(context.WithValue(outreq.Context(), timingsContextKey, timings), trace)
	outreq = outreq.WithContext(ctx)

	// Make the request
	timings.start = time.Now()
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

	// Expose the proxy-to-target network timings so the client can draw a
	// request timing waterfall. Content download is intentionally omitted: it
	// happens after the headers are flushed, and the client measures it itself.
	if serverTiming := timings.serverTimingHeader(); serverTiming != "" {
		w.Header().Set("Server-Timing", serverTiming)
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
