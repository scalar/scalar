#!/bin/sh

# Set default values for environment variables
export OPENAPI_MOUNT_DIR=${OPENAPI_MOUNT_DIR:-/mounted-docs}
export OPENAPI_BASE_URL=${OPENAPI_BASE_URL:-/docs}

# Run the document scanner to generate configuration
/usr/local/bin/scan-documents.sh

# Check if configuration was generated
if [ -f "/tmp/scalar-config.json" ]; then
    echo "✓ Configuration loaded from mounted documents"
fi

# Start Caddy server
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
