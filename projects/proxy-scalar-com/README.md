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
- Handles HTTP redirects while preserving headers
- Supports HTTPS (and even self-signed certificates)
- Request logging with method and target URL
- Health check endpoint at `/ping`
- Configurable port via environment variable (`PORT`)
- Preserves original request headers and body (except `Origin` header)
- Forwards `X-Scalar-Cookie` as `Cookie` header to circumvent the browser's cookie policy
- Forwards all HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Zero external dependencies (only using Go standard libraries)

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
