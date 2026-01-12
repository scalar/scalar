# Docker

<div class="flex gap-2">
<a href="https://hub.docker.com/r/scalarapi/mock-server"><img src="https://img.shields.io/docker/v/scalarapi/mock-server?label=Docker%20image"></a>
<a href="https://hub.docker.com/r/scalarapi/mock-server"><img src="https://img.shields.io/docker/pulls/scalarapi/mock-server?label=Docker%20pulls"></a>
<a href="https://discord.gg/scalar"><img src="https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2"></a>
</div>

Run the Scalar Mock Server in a Docker container.

## Quick Start

Pull and run the Docker image:

```bash
# Using command-line URL argument (Method 1)
docker run -p 3000:3000 \
  scalarapi/mock-server --url https://api.example.com/openapi.yaml

# Using environment variable with document content (Method 2)
docker run -p 3000:3000 \
  -e OPENAPI_DOCUMENT="$(cat ./openapi.yaml)" \
  scalarapi/mock-server

# Using URL environment variable (Method 3)
docker run -p 3000:3000 \
  -e OPENAPI_DOCUMENT_URL="https://api.example.com/openapi.yaml" \
  scalarapi/mock-server

# Using volume mount (Method 4)
docker run -p 3000:3000 \
  -v ./openapi.yaml:/docs/openapi.yaml:ro \
  scalarapi/mock-server
```

Visit `http://localhost:3000` to access your mock API endpoints, and `http://localhost:3000/scalar` for the built-in API reference documentation.

## Configuration Methods

The Docker image supports four ways to provide your OpenAPI document:

### Method 1: Command-Line URL Argument

Pass a URL to your OpenAPI document using the `--url` flag:

```bash
docker run -p 3000:3000 \
  scalarapi/mock-server --url https://api.example.com/openapi.yaml
```

The container will download the document from the specified URL at startup.

### Method 2: Environment Variable (Content)

Pass the content of your OpenAPI document directly via the `OPENAPI_DOCUMENT` environment variable:

```bash
docker run -p 3000:3000 \
  -e OPENAPI_DOCUMENT="$(cat ./openapi.yaml)" \
  scalarapi/mock-server
```

### Method 3: URL Environment Variable

Fetch your OpenAPI document from a URL using the `OPENAPI_DOCUMENT_URL` environment variable:

```bash
docker run -p 3000:3000 \
  -e OPENAPI_DOCUMENT_URL="https://api.example.com/openapi.yaml" \
  scalarapi/mock-server
```

The container will download the document from the specified URL at startup.

### Method 4: Volume Mounting

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

1. **`--url <URL>` command-line argument** (highest priority)
2. **`OPENAPI_DOCUMENT` environment variable**
3. **`OPENAPI_DOCUMENT_URL` environment variable**
4. **Volume-mounted documents** in `/docs` directory (lowest priority)

If none of these methods provide a document, the container will exit with an error message.

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
      # Or use URL to fetch document
      # OPENAPI_DOCUMENT_URL: https://api.example.com/openapi.yaml
    restart: unless-stopped
```

## Environment Variables

| Variable               | Description                                    | Required | Default |
| ---------------------- | ---------------------------------------------- | -------- | ------- |
| `OPENAPI_DOCUMENT`     | OpenAPI document content (JSON or YAML string) | No*      | -       |
| `OPENAPI_DOCUMENT_URL` | URL to fetch OpenAPI document from             | No*      | -       |

\* At least one method (command-line argument, environment variable, or volume mount) must be provided.


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

1. **OpenAPI document not found**: Ensure you've provided a document via one of the supported methods:
   - `--url <URL>` command-line argument
   - `OPENAPI_DOCUMENT` environment variable
   - `OPENAPI_DOCUMENT_URL` environment variable
   - Volume mount to `/docs` directory
2. **Invalid OpenAPI document**: Check that your document is valid OpenAPI/Swagger format
3. **URL fetch failed**: If using `OPENAPI_DOCUMENT_URL`, verify the URL is accessible and returns a valid OpenAPI document
4. **Check logs**: Run `docker logs <container-id>` to see error messages

### Port Already in Use

If port 3000 is already in use, map to a different port:

```bash
docker run -p 8080:3000 scalarapi/mock-server
```
