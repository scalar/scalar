# Use the official Caddy image as a parent image
FROM caddy:2-alpine

# Set the working directory in the container
WORKDIR /usr/share/caddy

# Copy the HTML file into the container
COPY index.html .

# Copy the Caddyfile into the container
COPY Caddyfile /etc/caddy/Caddyfile

# Expose the port Caddy will run on
EXPOSE 80

# Use an environment variable for the OpenAPI document URL, with a default value
ENV OPENAPI_DOCUMENT_URL=https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json

# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

