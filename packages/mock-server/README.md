# Scalar Mock Server

[![Version](https://img.shields.io/npm/v/@scalar/mock-server)](https://www.npmjs.com/package/@scalar/mock-server)
[![Downloads](https://img.shields.io/npm/dm/@scalar/mock-server)](https://www.npmjs.com/package/@scalar/mock-server)
[![License](https://img.shields.io/npm/l/@scalar/mock-server)](https://www.npmjs.com/package/@scalar/mock-server)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

A powerful Node.js mock server that automatically generates realistic API responses from your OpenAPI/Swagger documents. It creates fully-functional endpoints with mock data, handles authentication, and respects content types - making it perfect for frontend development, API prototyping, and integration testing.

## Usage

```bash
npx @scalar/cli document mock openapi.json --watch
```

## Docker

The mock server is also available as a Docker image. You can provide your OpenAPI document in three different ways:

### Via Volume Binding

Mount your OpenAPI document into the `/docs` directory:

```bash
docker run -v ./my-api.yaml:/docs/api.yaml -p 3000:3000 scalar/mock-server
```

The container will automatically scan the `/docs` directory for OpenAPI documents (`.yaml`, `.yml`, or `.json` files) and use the first one found.

### Via Environment Variable

Pass the OpenAPI document content directly as an environment variable:

```bash
docker run -e OPENAPI_DOCUMENT="$(cat my-api.yaml)" -p 3000:3000 scalar/mock-server
```

### Configuration

- **Port**: The server runs on port 3000 by default. You can change it using the `PORT` environment variable:
  ```bash
  docker run -e PORT=8080 -p 8080:8080 scalar/mock-server
  ```

- **API Reference**: The API Reference UI is automatically available at the root path (`/scalar`) when the container starts.

## Documentation

[Read the documentation here](https://guides.scalar.com/scalar/scalar-mock-server/getting-started)

## Community

We are API nerds. You too? Let's chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).
