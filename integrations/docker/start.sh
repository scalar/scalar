#!/bin/sh

echo "Starting Scalar API Reference with document mounting support..."

# Set default values for environment variables
export OPENAPI_MOUNT_DIR=${OPENAPI_MOUNT_DIR:-/mounted-docs}
export OPENAPI_BASE_URL=${OPENAPI_BASE_URL:-/docs}

echo "Mount directory: $OPENAPI_MOUNT_DIR"
echo "Base URL for documents: $OPENAPI_BASE_URL"

# Run the document scanner to generate configuration
echo "Scanning for mounted OpenAPI documents..."
/usr/local/bin/scan-documents.sh

# Check if configuration was generated
if [ -f "/tmp/scalar-config.json" ]; then
    echo "Configuration generated successfully"
    echo "Configuration content:"
    cat /tmp/scalar-config.json
else
    echo "No configuration generated, will use environment variables only"
fi

echo "Starting Caddy server..."
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
