# Docker

Run the Scalar Mock Server in a Docker container.

## Quick Start

Pull and run the Docker image:

```bash
docker run -p 3000:3000 \
  -v ./openapi.yaml:/docs/openapi.yaml:ro \
  scalarapi/mock-server
```

Visit `http://localhost:3000` to access your mock API endpoints, and `http://localhost:3000/scalar` for the built-in API reference documentation.

## Configuration Methods

The Docker image supports two ways to provide your OpenAPI document:

### Method 1: Environment Variable

Pass the content of your OpenAPI document directly via the `OPENAPI_DOCUMENT` environment variable:

```bash
docker run -p 3000:3000 \
  -e OPENAPI_DOCUMENT="$(cat ./openapi.yaml)" \
  scalarapi/mock-server
```

### Method 2: Volume Mounting

Mount your OpenAPI documents directory to `/docs` in the container:

```bash
docker run -p 3000:3000 \
  -v ./documents:/docs:ro \
  scalarapi/mock-server
```

The container automatically:
- Scans the `/docs` directory recursively
- Finds OpenAPI documents (`.json`, `.yaml`, `.yml` files)
- Uses the first valid document found

### Priority Order

The container uses the following priority when loading documents:

1. **`OPENAPI_DOCUMENT` environment variable** (highest priority)
2. **Volume-mounted documents** in `/docs` directory

If neither is provided, the container will exit with an error message.

## Built-in Features

The Docker image includes several built-in features:

### Mock API Endpoints

All endpoints defined in your OpenAPI document are automatically available as mock endpoints. The server generates realistic responses based on your schemas and examples.

### API Reference UI

Access the interactive API reference documentation at `/scalar`:

```
http://localhost:3000/scalar
```

### OpenAPI Document Endpoints

Your OpenAPI document is automatically served at:

- `/openapi.json` - JSON format
- `/openapi.yaml` - YAML format

The format is automatically determined based on your source document.

This helps with debugging and monitoring during development.

## Docker Compose

Here's a complete `docker-compose.yml` example:

```yaml
services:
  mock-server:
    image: scalarapi/mock-server:latest
    ports:
      - "3000:3000"
    volumes:
      # Mount your OpenAPI documents directory
      - ./documents:/docs:ro
    environment:
      # Optional: Use environment variable instead of volume mount
      # OPENAPI_DOCUMENT: |
      #   openapi: 3.0.0
      #   info:
      #     title: My API
      #     version: 1.0.0
    restart: unless-stopped
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAPI_DOCUMENT` | OpenAPI document content (JSON or YAML string) | No* | - |


## Port Configuration

The mock server runs on port `3000` inside the container by default. Map it to any host port:

```bash
# Map to host port 8080
docker run -p 8080:3000 \
  -v ./openapi.yaml:/docs/openapi.yaml:ro \
  scalarapi/mock-server

# Access at http://localhost:8080
```

## Troubleshooting

### Container Exits Immediately

If the container exits immediately, check:

1. **OpenAPI document not found**: Ensure you've provided either `OPENAPI_DOCUMENT` or mounted documents to `/docs`
2. **Invalid OpenAPI document**: Check that your document is valid OpenAPI/Swagger format
3. **Check logs**: Run `docker logs <container-id>` to see error messages

### Port Already in Use

If port 3000 is already in use, map to a different port:

```bash
docker run -p 8080:3000 scalarapi/mock-server
```
