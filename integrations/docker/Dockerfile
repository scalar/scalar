# Use the official Caddy image as a parent image
FROM caddy:2

# Create a non-root user
RUN adduser -D -u 1000 caddy

# Copy the files into the container
COPY ./assets /usr/share/caddy

# Copy the Caddy configuration file
COPY Caddyfile /etc/caddy/Caddyfile

# Copy the document scanning script
COPY scan-documents.sh /usr/local/bin/scan-documents.sh
RUN chmod +x /usr/local/bin/scan-documents.sh

# Copy the startup script
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Create mount point for OpenAPI documents
RUN mkdir -p /mounted-docs

# Set proper ownership of all Caddy directories
RUN chown -R caddy:caddy /usr/share/caddy /etc/caddy /config/caddy /data/caddy

# Switch to the non-root user
USER caddy

EXPOSE 8080

# Environment variable for API reference configuration
ENV API_REFERENCE_CONFIG=undefined

# Environment variable for CDN URL
ENV CDN_URL=scalar.js

# Environment variables for document mounting
ENV OPENAPI_MOUNT_DIR=/mounted-docs
ENV OPENAPI_BASE_URL=/docs

# Use the startup script as entrypoint
ENTRYPOINT ["/usr/local/bin/start.sh"]

# Health check - Caddy starts very quickly
HEALTHCHECK --interval=10s --timeout=3s --start-period=2s --retries=2 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1
