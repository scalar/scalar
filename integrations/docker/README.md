# Scalar API Reference Docker Integration

This Docker integration provides a flexible way to serve Scalar API Reference documentation with support for both static configuration and dynamic document mounting.

## Features

- **Static Configuration**: Use environment variables to configure a single API reference
- **Dynamic Document Mounting**: Mount OpenAPI documents directly into the container for automatic discovery
- **Multi-Document Support**: Serve multiple API versions or different APIs in a single interface
- **Flexible File Organization**: Support for nested directory structures
- **Combined Configuration**: Mix mounted documents with environment-based configuration

## Quick Start

### Using Environment Variables

```bash
docker run -p 8080:8080 \
  -e API_REFERENCE_CONFIG='{"sources":[{"url": "https://api.example.com/openapi.json"}]}' \
  scalarapi/api-reference:latest
```

### Using Document Mounting

```bash
docker run -p 8080:8080 \
  -v /path/to/your/openapi-docs:/mounted-docs \
  scalarapi/api-reference:latest
```

## Document Mounting

The Docker container can automatically discover and serve OpenAPI documents mounted to `/mounted-docs`. This is particularly useful for:

- Development environments where documents change frequently
- CI/CD pipelines that generate API documentation
- Multi-API setups with different versions or services

### Supported File Types

- **JSON**: `.json` files containing OpenAPI 3.x or Swagger 2.x specifications
- **YAML**: `.yaml` or `.yml` files containing OpenAPI 3.x or Swagger 2.x specifications

### Directory Structure

You can organize documents in subdirectories:

```
/mounted-docs/
├── api-v1.json
├── api-v2.yaml
├── internal/
│   └── admin-api.json
└── external/
    └── partner-api.yaml
```

This creates sources with titles like:
- `api-v1`
- `api-v2`
- `internal - admin-api`
- `external - partner-api`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAPI_MOUNT_DIR` | Directory path for mounted documents | `/mounted-docs` |
| `OPENAPI_BASE_URL` | Base URL for serving documents | `/docs` |

## Configuration

The container supports two configuration methods:

1. **Environment Variable**: Set `API_REFERENCE_CONFIG` with a JSON configuration
2. **Document Mounting**: Mount OpenAPI documents to `/mounted-docs`

You can also combine both approaches - mounted documents will be added to any existing configuration.

## Examples

### Multiple API Versions

```bash
# Mount directory with multiple API versions
docker run -p 8080:8080 \
  -v /home/user/api-docs:/mounted-docs \
  scalarapi/api-reference:latest
```

### Development with Live Reload

```bash
# Mount local development directory
docker run -p 8080:8080 \
  -v $(pwd)/docs:/mounted-docs \
  scalarapi/api-reference:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  api-reference:
    image: scalarapi/api-reference:latest
    ports:
      - "8080:8080"
    volumes:
      - ./api-docs:/mounted-docs
    environment:
      API_REFERENCE_CONFIG: |
        {
          "theme": "purple",
          "customCss": "body { font-family: 'Inter', sans-serif; }"
        }
```

### Custom Configuration

```bash
# Custom mount directory and base URL
docker run -p 8080:8080 \
  -v /custom/path:/custom-docs \
  -e OPENAPI_MOUNT_DIR=/custom-docs \
  -e OPENAPI_BASE_URL=/api-docs \
  scalarapi/api-reference:latest
```

## How It Works

1. **Startup**: The container runs a shell-based document scanner that searches for OpenAPI documents
2. **Discovery**: Documents are automatically detected and validated using native shell commands
3. **Configuration**: A JSON configuration is generated with all discovered documents
4. **Serving**: Documents are served at `/docs/{filename}` and the configuration is available at `/api/config`
5. **Rendering**: The frontend loads the configuration and renders the API reference

The implementation uses only native shell scripting and standard Unix tools (find, grep, sed, etc.), making it lightweight and compatible with minimal container environments.

## Health Check

The container includes a health check endpoint at `/health` that returns `OK` with a `200` status code.

## Building from Source

```bash
# Clone the repository
git clone https://github.com/scalar/scalar.git
cd scalar/integrations/docker

# Build the Docker image
docker build -t scalarapi/api-reference:latest .
```

## Troubleshooting

### No Documents Found

If no documents are found, check:
- Documents are mounted to the correct directory (default: `/mounted-docs`)
- Files have supported extensions (`.json`, `.yaml`, `.yml`)
- Files contain valid OpenAPI or Swagger specifications
- Container has read permissions for the mounted directory

### Configuration Not Loading

If the configuration doesn't load:
- Check that documents are valid OpenAPI/Swagger specifications
- Verify the container logs for scanning errors
- Ensure the `/api/config` endpoint is accessible
- Check that the `API_REFERENCE_CONFIG` environment variable is set if not using document mounting

### File Access Issues

If files can't be accessed:
- Ensure the mounted directory has proper permissions
- Check that the container user (caddy) can read the files
- Verify the file paths are correct