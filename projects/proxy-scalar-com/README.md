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
- Follows same-origin HTTP redirects while preserving headers. Redirects to another scheme, hostname, or effective port are rejected to protect credentials in headers and request bodies.
- Supports HTTPS (and even self-signed certificates)
- Request logging with method and target URL
- Health check endpoint at `/ping`
- Configurable port via environment variable (`PORT`)
- Preserves original request headers and body (except `Origin` header)
- Forwards `X-Scalar-Cookie` as `Cookie` header to circumvent the browser's cookie policy
- Forwards all HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Zero external dependencies (only using Go standard libraries)

## Security

The proxy returns content from arbitrary URLs on its own origin, so it keeps that content from acting on the proxy origin in a browser:

- Requests where the browser opens the proxy URL as a page (link, redirect, form, iframe, `<object>`, `<embed>`) are rejected with `403`, based on the `Sec-Fetch-Mode` and `Sec-Fetch-Dest` headers. `fetch()`, `XMLHttpRequest`, and non-browser clients are not affected.
- Every proxied response is sent with `Content-Security-Policy: default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; sandbox` and `X-Content-Type-Options: nosniff`, for browsers that do not send `Sec-Fetch-*` headers.
- Upstream headers that browsers act on for the proxy origin (`Refresh`, `Clear-Site-Data`, `Content-Security-Policy`, `Content-Security-Policy-Report-Only`, `X-Content-Type-Options`, `NEL`, `Report-To`, `Reporting-Endpoints`, `Strict-Transport-Security`, `Alt-Svc`, `Set-Login`, `Observe-Browsing-Topics`, and `Attribution-Reporting-Register-*`) are forwarded as `X-Scalar-Original-*` instead, and `Set-Cookie` as `X-Scalar-Set-Cookie`. The API client, post-response scripts, and the agent see the original values.
- Proxied responses vary on `Sec-Fetch-Mode` and `Sec-Fetch-Dest`, so a shared cache cannot serve a `fetch()` response to a page load.
- Same-origin redirects that reach the browser carry the absolute URL the proxy validated, not the raw upstream `Location` value. Redirects with more than one `Location` are rejected.

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
