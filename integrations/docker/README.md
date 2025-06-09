# Scalar Docker API Reference Integration

[![Docker Pulls](https://img.shields.io/docker/pulls/scalarapi/api-reference)](https://hub.docker.com/r/scalarapi/api-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This Docker image `scalarapi/api-reference` provides an easy way to render beautiful API references based on OpenAPI/Swagger documents using a containerized solution.

## Features

- Stunning API Reference
- Lightweight Docker image based on Caddy

## Usage

### Quick Start

Run the Docker container with your OpenAPI configuration:

```bash
docker run -p 8080:8080 -e API_REFERENCE_CONFIG='{"sources":[{"url": "https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json"}],"theme": "purple"}' scalarapi/api-reference:latest
```

Visit `http://localhost:8080` to see your API reference.

### Using Docker Compose

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
              "url": "https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json"
            }
          ]
          "theme": "purple"
        }
```

Run with:

```bash
docker-compose up
```

### Configuration

The Docker image is configured via the `API_REFERENCE_CONFIG` environment variable, which should contain a JSON string with your Scalar configuration.

### Available Tags

- `latest` - Latest stable release
- `{version}` - Specific version (e.g., `0.2.0`)

### Health Check

The container includes a health check endpoint at `/health` that returns `OK` with a `200` status code.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `API_REFERENCE_CONFIG` | JSON configuration for the Scalar API Reference | Yes |

## Configuration Options

For detailed configuration options, refer to the [main Scalar documentation](https://github.com/scalar/scalar/blob/main/documentation/configuration.md).

## Building from Source

```bash
# Clone the repository
git clone https://github.com/scalar/scalar.git
cd scalar/integrations/docker

# Build the Docker image
docker build -t scalarapi/api-reference:latest .
```

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
