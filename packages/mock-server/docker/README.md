# Scalar Mock Server - Docker Package

This package contains the Docker deployment configuration for the Scalar Mock Server. It's a standalone package that can be built independently from the main mock-server package.

## Building

### Local Build

Build the Docker entrypoint:

```bash
cd packages/mock-server/docker
pnpm install
pnpm build
```

This will create the `dist/` directory with the compiled `docker-entrypoint.js` file.

### Building the Docker Image

After building locally, you can build the Docker image:

```bash
cd packages/mock-server/docker
pnpm build
docker build -t scalar-mock-server .
```

## Usage

### Via Volume Binding

Mount your OpenAPI document into the `/docs` directory:

```bash
docker run -v ./my-api.yaml:/docs/api.yaml -p 3000:3000 scalar-mock-server
```

The container will automatically scan the `/docs` directory for OpenAPI documents (`.yaml`, `.yml`, or `.json` files) and use the first one found.

### Via Environment Variable

Pass the OpenAPI document content directly as an environment variable:

```bash
docker run -e OPENAPI_DOCUMENT="$(cat my-api.yaml)" -p 3000:3000 scalar-mock-server
```

### Via URL

Provide a URL to fetch the OpenAPI document from:

```bash
docker run -e OPENAPI_URL=https://example.com/api.yaml -p 3000:3000 scalar-mock-server
```

## Configuration

### Environment Variables

- **`OPENAPI_DOCUMENT`**: The full content of the OpenAPI document as a string (highest priority)
- **`OPENAPI_URL`**: URL to fetch the OpenAPI document from (second priority)
- **`PORT`**: Port to run the server on (default: 3000)

### Volume Mounts

- **`/docs`**: Directory to scan for OpenAPI documents (lowest priority, used if no environment variables are set)

### Ports

- **3000**: Default port for the mock server. Change via `PORT` environment variable.

## Features

- **API Reference UI**: Automatically available at the root path (`/`) when the container starts
- **Mock Data Generation**: Automatically generates realistic mock responses based on your OpenAPI schema
- **Authentication Support**: Handles various authentication methods defined in your OpenAPI document
- **Content Type Handling**: Respects content types and response formats from your specification

## Architecture

This Docker package is separate from the main `@scalar/mock-server` package to:

1. Keep Docker-specific code isolated
2. Simplify the Dockerfile (no complex workspace resolution needed)
3. Allow independent builds and deployments
4. Make the Docker image smaller and more maintainable

The package depends on:
- `@scalar/mock-server` - The core mock server functionality
- `@scalar/hono-api-reference` - API Reference UI
- `@hono/node-server` - Node.js server runtime
