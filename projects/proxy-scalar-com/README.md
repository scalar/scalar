# Go Proxy

[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

When making requests from a web browser to different domains, browsers enforce the Same-Origin Policy by default. These
cross-origin requests are blocked unless the target server implements proper [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
(Cross-Origin Resource Sharing) headers.

The Scalar Proxy Server acts as an intermediary, forwarding requests to external servers while automatically adding the
necessary CORS headers to the responses. This enables seamless cross-origin requests when using the Scalar API Client
in browser environments.

## Features

- Full CORS support
- Follows same-origin HTTP redirects while preserving headers, including 307 and 308 after the upload completes, with request bodies up to 10 MiB, while at most 128 MiB of request bodies are buffered in total. Redirects to another scheme, hostname, or effective port are rejected to protect credentials in headers and request bodies.
- Streams uploads immediately, retaining a bounded copy for redirects. Redirects received before an upload completes are returned without replaying a partial body.
- Supports HTTPS, and verifies upstream certificates (see [Configuration](#configuration) for development setups)
- Error logging with safe failure categories, without target URLs or free-form error messages
- Health check endpoint at `/ping`
- Configurable port via environment variable (`PORT`)
- Preserves original request headers and body (except `Origin` header)
- Forwards `X-Scalar-Cookie` as `Cookie` header to circumvent the browser's cookie policy
- Forwards all HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Zero external dependencies (only using Go standard libraries)

## Security

The proxy returns content from arbitrary URLs on its own origin, so it keeps that content from acting on the proxy origin in a browser:

- Requests where the browser opens the proxy URL as a page (link, redirect, form, iframe, `<object>`, `<embed>`) or as a worker script are rejected with `403`, based on the `Sec-Fetch-Mode` and `Sec-Fetch-Dest` headers. `fetch()`, `XMLHttpRequest`, and non-browser clients are not affected.
- Service worker update checks get a script that unregisters the worker, so a worker registered on the proxy origin before document requests were rejected removes itself instead of staying installed.
- Every proxied response is sent with `Content-Security-Policy: default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; sandbox` and `X-Content-Type-Options: nosniff`, for browsers that do not send `Sec-Fetch-*` headers.
- Upstream headers that browsers act on for the proxy origin are forwarded as `X-Scalar-Original-*` instead, and `Set-Cookie` as `X-Scalar-Set-Cookie`. This covers `Refresh`, `Clear-Site-Data`, `Content-Security-Policy`, `Content-Security-Policy-Report-Only`, `X-Content-Type-Options`, `NEL`, `Report-To`, `Reporting-Endpoints`, `Strict-Transport-Security`, `Alt-Svc`, `No-Vary-Search`, `Use-As-Dictionary`, `Cache-Control`, CDN cache headers, front-server headers (`X-Accel-*`, `X-Sendfile`, `X-Lighttpd-Send-File`), `Set-Login`, `Observe-Browsing-Topics`, `Activate-Storage-Access`, `Speculation-Rules`, and the `Sec-*`, `Secure-Session-*`, `Shared-Storage-*`, `Ad-Auction-*`, and `Attribution-Reporting-*` families. The API client, request history, post-response scripts, and the agent see the original values. The browser's `Available-Dictionary` and `Dictionary-ID` request headers are not forwarded.
- `Cache-Control` is always `private`, keeping the upstream's other directives, so a shared cache never stores a response made with someone's credentials. Responses also vary on `Sec-Fetch-Mode` and `Sec-Fetch-Dest`, and the upstream's own `Vary` is passed on as `X-Scalar-Original-Vary`.
- Redirects that reach the browser are never followed: the validated absolute URL is passed on as `X-Scalar-Original-Location`, and redirects to another origin or with more than one `Location` are rejected.
- Upstream headers that use the proxy's own names (`X-Scalar-Original-*`, `X-Scalar-Modified-Headers`, `X-Scalar-Set-Cookie`) are dropped.
- Hop-by-hop response headers (`Connection` and every header it names, `Keep-Alive`, `Proxy-*`, `TE`, `Trailer`, `Transfer-Encoding`, `Upgrade`) are not forwarded.
- A `scalar_url` that points to the proxy itself (the host the request came in on, or one listed in `PROXY_SELF_HOSTS`) is rejected with `400`. Outgoing requests carry `X-Scalar-Proxy-Hop`, and incoming requests that have it are rejected with `508`, which also stops loops through a hostname the proxy does not know.
- Upstream requests are cancelled when the client disconnects. An upstream that does not send response headers within 5 minutes gets a `504`, and no upstream request runs longer than 30 minutes. Client connections have read and idle timeouts.

Incoming clients have 10 seconds to finish sending request headers. Idle keep-alive connections close after 60 seconds between requests. Each incoming body read also has a 60-second idle deadline, refreshed for every read and cleared between reads. These limits do not impose a whole-request deadline on active uploads or streaming responses such as SSE.

The proxy adds `X-Scalar-Proxy-Hop: 1` to outbound requests and rejects forwarding requests already containing that header, including empty values, with HTTP 508. Hop-by-hop headers are stripped before setting the marker so intermediaries cannot remove it through `Connection`. APIs on the same host and the proxy's own reference endpoints remain accessible.

A third-party relay that drops unknown headers can remove this marker. Alternating proxy and relay destinations can therefore amplify requests until the nested URL is exhausted; the marker only bounds chains that preserve it.

Hop-by-hop headers, including every field named by `Connection`, are removed from requests and responses. They are removed before response metadata is mirrored and the proxy adds its own security and CORS headers, so an upstream cannot tell a front proxy to discard those protections. Proxy authentication headers are connection-specific and are not forwarded to target APIs.

## Usage

### Requirements

- [Go](https://go.dev/)

### Run

You can start the proxy server in two ways. The default port is 1337:

```bash
go run main.go
```

```bash
2024/05/08 10:49:59 🥤 Proxy Server listening on http://localhost:1337
```

But you can customize it using the `PORT` environment variable:

```bash
PORT=8080 go run main.go
```

### Configuration

| Environment variable          | Description |
| ----------------------------- | ----------- |
| `PORT`                        | The port to listen on. Defaults to `1337`. |
| `ENV=dev`                     | Development mode: allows targets on private and loopback addresses, skips upstream certificate verification, and listens on `127.0.0.1` only. |
| `PROXY_LISTEN_HOST`           | The address to listen on, for example `0.0.0.0` to accept connections from outside a container in development mode. Defaults to every interface, or `127.0.0.1` in development mode. |
| `ALLOW_INSECURE_UPSTREAM_TLS` | Set to `true` to skip upstream certificate verification outside development mode, for example to reach APIs with self-signed certificates. Anyone who can intercept that traffic can then read and change it. |
| `PROXY_SELF_HOSTS`            | Comma-separated hosts that also reach this proxy, like a custom domain or the Cloud Run URL. Targets on these hosts are rejected. A host without a port matches every port. |

### Example request

```bash
curl --request GET \
     --url 'localhost:1337?scalar_url=https%3A%2F%2Fgalaxy.scalar.com%2Fplanets'
```

```json
{
  "data": [
    {
      "id": 1,
      "name": "Mars",
      "description": "The red planet",
      "image": "https://cdn.scalar.com/photos/mars.jpg",
      "creator": {
        "id": 1,
        "name": "Marc",
        "email": "marc@scalar.com"
      }
    }
  ],
  "meta": {
    "limit": 10,
    "offset": 0,
    "total": 100,
    "next": "/planets?limit=10&offset=10"
  }
}
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
