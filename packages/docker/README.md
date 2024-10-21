# Scalar Docker Container

This Docker container provides a simple web server using Caddy, serving a customizable HTML page. It's designed to be easily configurable and deployable.

- Customizable port and OpenAPI document URL through environment variables
- Based on the official Caddy Alpine image

## Usage

### Using Docker

1. Pull the Docker image from Docker Hub:

   ```
   docker pull scalar/api-reference:latest
   ```

2. Run the container:

   ```
   docker run -p 8080:8080 -e PORT=8080 -e OPENAPI_DOCUMENT_URL=https://example.com scalar/api-reference:latest
   ```

This will start the container, mapping port 8080 on your host to port 8080 in the container, and setting the `PORT` and `OPENAPI_DOCUMENT_URL` environment variables.

3. Access the server at `http://localhost:8080`

### Using Docker Compose

1. Ensure you have Docker and Docker Compose installed on your system.
2. Create a `docker-compose.yml` file in your project directory with the following content:

   ```yaml
   version: '3.8'

   services:
     web:
       image: scalar/api-reference:latest
       ports:
         - '8080:8080'
       environment:
         - PORT=8080
         - OPENAPI_DOCUMENT_URL=https://example.com
   ```

3. Run the following command in the directory containing the `docker-compose.yml` file:

   ```
   docker-compose up
   ```

4. Access the server at `http://localhost:8080`
