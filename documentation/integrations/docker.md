# Scalar API Reference Docker Image

## Quick Start

Run the Docker container with your OpenAPI configuration:

```bash
docker run -p 8080:8080 -e API_REFERENCE_CONFIG='{"sources":[{"url": "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json"}],"theme": "purple"}' scalarapi/api-reference:latest
```

Visit `http://localhost:8080` to see your API reference.

## Configuration

The Docker image supports two configuration methods:

### 1. Environment Variable

Set the `API_REFERENCE_CONFIG` environment variable with your Scalar configuration:

```bash
docker run -p 8080:8080 \
  -e API_REFERENCE_CONFIG='{"sources":[{"url":"https://api.example.com/openapi.json"}],"theme":"purple"}' \
  scalarapi/api-reference:latest
```

### 2. Document Mounting

Mount OpenAPI documents directly into the container for automatic discovery:

```bash
docker run -p 8080:8080 \
  -v /path/to/your/openapi-docs:/mounted-docs \
  scalarapi/api-reference:latest
```

The container automatically:
- Scans for OpenAPI documents (`.json`, `.yaml`, `.yml` files)
- Serves documents at `/docs/{filename}`
- Generates titles from directory structure

**Directory structure example:**
```
/mounted-docs/
├── api-v1.json
├── internal/admin-api.yaml
└── external/partner-api.json
```

### 3. Combined Configuration

You can combine both approaches:

```bash
docker run -p 8080:8080 \
  -v /path/to/your/openapi-docs:/mounted-docs \
  -e API_REFERENCE_CONFIG='{"theme": "purple"}' \
  scalarapi/api-reference:latest
```

## Docker Compose

```yaml
services:
  api-reference:
    image: scalarapi/api-reference:latest
    ports:
      - "8080:8080"
    volumes:
      # Mount your OpenAPI documents directory
      - ./api-docs:/mounted-docs
    environment:
      # Optional: Add global configuration like theme
      # API_REFERENCE_CONFIG: |
      #   {
      #     "theme": "purple"
      #   }
      # Optional: Custom mount directory and base URL
      # OPENAPI_MOUNT_DIR: /mounted-docs
      # OPENAPI_BASE_URL: /docs
    restart: unless-stopped
```

## Environment Variables

| Variable               | Description                                                    | Default |
| ---------------------- | -------------------------------------------------------------- | ------- |
| `API_REFERENCE_CONFIG` | JSON configuration for the Scalar API Reference                | - |
| `CDN_URL`              | URL for the API Reference CDN                                 | `scalar.js` |
| `OPENAPI_MOUNT_DIR`    | Directory path for mounted OpenAPI documents                   | `/mounted-docs` |
| `OPENAPI_BASE_URL`     | Base URL path for serving mounted documents                    | `/docs` |

**Note:** Either `API_REFERENCE_CONFIG` must be set OR documents must be mounted to `/mounted-docs`

## Health Check

The container includes a health check endpoint at `/health` that returns `OK` with a `200` status code.

For detailed configuration options, refer to the [main Scalar documentation](https://guides.scalar.com/scalar/scalar-api-references/configuration).
