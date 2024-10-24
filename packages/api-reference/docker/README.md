# Scalar Docker Container

![Docker Pulls](https://img.shields.io/docker/pulls/scalarapi/api-reference)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

This Docker container provides a simple web server using Caddy, serving a customizable HTML page. It’s designed to be easily configurable and deployable.

- Customizable port and OpenAPI document URL through environment variables
- Based on the official Caddy Alpine image

## Usage

### Using Docker

1. Pull the Docker image from Docker Hub:

   ```
   docker pull scalarapi/api-reference:latest
   ```

2. Run the container:

   ```
   docker run -p 1234:80 \
     -e OPENAPI_DOCUMENT_URL=https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json \
     -e API_REFERENCE_CONFIG='{"theme":"purple"}' \
     scalarapi/api-reference:latest
   ```

This will start the container, mapping port 1234 on your host to port 80 in the container, setting the `OPENAPI_DOCUMENT_URL` environment variable, and providing a configuration for the API reference.

3. Access the server at `http://localhost:1234`

### Port Configuration

The container is configured to listen on port 80 internally. When running the container, you can map this internal port to any available port on your host machine using the `-p` flag in Docker run command or the `ports` section in Docker Compose.

For example:

- `-p 1234:80` maps port 80 in the container to port 1234 on your host
- `-p 8080:80` would map it to port 8080 on your host

Choose a port that’s available on your system and adjust your browser URL accordingly.

### Using Docker Compose

1. Ensure you have Docker and Docker Compose installed on your system.
2. Create a `docker-compose.yml` file in your project directory with the following content:

   ```yaml
   version: '3.8'

   services:
     web:
       image: scalarapi/api-reference:latest
       ports:
         - '1234:80'
       environment:
         - OPENAPI_DOCUMENT_URL=https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json
         - API_REFERENCE_CONFIG={"theme":"purple"}
   ```

3. Run the following command in the directory containing the `docker-compose.yml` file:

   ```
   docker-compose up
   ```

4. Access the server at `http://localhost:1234`

## Community

We are API nerds. You too? Let’s chat on Discord: <https://discord.gg/scalar>

## License

The source code in this repository is licensed under [MIT](https://github.com/scalar/scalar/blob/main/LICENSE).

## Configuration

You can customize the API reference by passing a JSON string as the `API_REFERENCE_CONFIG` environment variable. For example:

```
-e API_REFERENCE_CONFIG='{"theme":"purple","hideTryIt":true}'
```

This allows you to set various options for the API reference. Refer to the Scalar API Reference documentation for all available configuration options.
