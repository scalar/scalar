# Use the official Caddy image as a parent image
FROM caddy:2

# Create a non-root user
RUN adduser -D -u 1000 caddy

# Copy the files into the container
COPY ./assets /usr/share/caddy

# Copy the Caddy configuration file
COPY Caddyfile /etc/caddy/Caddyfile

# Set proper ownership of all Caddy directories
RUN chown -R caddy:caddy /usr/share/caddy /etc/caddy /config/caddy /data/caddy

# Switch to the non-root user
USER caddy

EXPOSE 8080

# Environment variable for API reference configuration
ENV API_REFERENCE_CONFIG=undefined

# Environment variable for CDN URL
ENV CDN_URL=standalone.js
