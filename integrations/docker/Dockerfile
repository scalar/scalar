# Use the official Caddy image as a parent image
FROM caddy:2-alpine

# Create a non-root user
RUN adduser -D -u 1000 caddy

# Set the working directory in the container
WORKDIR /usr/share/caddy

# Copy the HTML file into the container
COPY ./assets .

# Copy the Caddyfile into the container
COPY Caddyfile /etc/caddy/Caddyfile

# Set proper ownership of files
RUN chown -R caddy:caddy /usr/share/caddy /etc/caddy /config/caddy /data/caddy

# Switch to non-root user
USER caddy

EXPOSE 8080

ENV API_REFERENCE_CONFIG=undefined

