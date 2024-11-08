# Go Proxy

[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

The Scalar Proxy redirects requests to another server to avoid CORS issues. It’s made to work well with the Scalar API Client.

## Features

- Full CORS support with customizable origins
- Handles HTTP redirects while preserving headers
- Supports HTTPS with TLS
- Request logging with method and target URL
- Health check endpoint at `/ping`
- Configurable port via environment variable
- Preserves original request headers and body
- Forwards all HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Zero external dependencies - uses only Go standard library

## Usage

### Requirements

- [Go](https://go.dev/)

### Run

```bash
go run main.go
```

```bash
2024/05/08 10:49:59 🥤 Proxy Server listening on http://localhost:1337
```

```bash
PORT=8080 go run main.go
```

### Example

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

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
