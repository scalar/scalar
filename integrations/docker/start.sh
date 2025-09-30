#!/bin/sh

# Run the document scanner to generate configuration
/usr/local/bin/scan-documents.sh

# Check if configuration was generated
if [ -f "/tmp/configuration.json" ]; then
    echo "✓ Configuration generated from the mounted OpenAPI documents."
fi

# Start Caddy server
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
