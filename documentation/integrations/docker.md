# Scalar API Reference Docker Image

## Quick Start

Run the Docker container with your OpenAPI configuration:

```bash
docker run -p 8080:8080 -e API_REFERENCE_CONFIG='{"sources":[{"url": "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json"}],"theme": "purple"}' scalarapi/api-reference:latest
```

Visit `http://localhost:8080` to see your API reference.

## Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
services:
  api-reference:
    image: scalarapi/api-reference:latest
    ports:
      - "8080:8080"
    environment:
      API_REFERENCE_CONFIG: |
        {
          "sources": [
            {
              "url": "https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json"
            }
          ],
          "theme": "purple"
        }
```

Run with:

```bash
docker-compose up
```

## Configuration

The Docker image is configured via the `API_REFERENCE_CONFIG` environment variable, which should contain a JSON string with your Scalar configuration.

## Available Tags

- `latest` - Latest stable release
- `{version}` - Specific version (e.g., `0.2.0`)

## Health Check

The container includes a health check endpoint at `/health` that returns `OK` with a `200` status code.

## Environment Variables

| Variable               | Description                                                    | Required |
| ---------------------- | -------------------------------------------------------------- | -------- |
| `API_REFERENCE_CONFIG` | JSON configuration for the Scalar API Reference                | Yes      |
| `CDN_URL`              | URL for the API Reference CDN (default: local `standalone.js`) | No       |

## Configuration Options

For detailed configuration options, refer to the [main Scalar documentation](https://guides.scalar.com/scalar/scalar-api-references/configuration).

## Building from Source

```bash
# Clone the repository
git clone https://github.com/scalar/scalar.git
cd scalar/integrations/docker

# Build the Docker image
docker build -t scalarapi/api-reference:latest .
```
