#!/bin/sh

# Document scanning script for Scalar Docker integration
# Scans mounted directories for OpenAPI documents and generates configuration

MOUNT_DIR="/docs"
BASE_URL="/openapi"
CONFIG_FILE="/tmp/configuration.json"

echo "Scanning for OpenAPI documents in: $MOUNT_DIR"

# Check if mount directory exists
if [ ! -d "$MOUNT_DIR" ]; then
    echo '{"sources":[]}' > "$CONFIG_FILE"
    exit 0
fi

# Function to check if a file is a valid OpenAPI document
is_openapi_doc() {
    file="$1"
    ext="${file##*.}"

    case "$ext" in
        json|yaml|yml)
            if [ "$ext" = "json" ]; then
                if grep -q '"openapi"' "$file" 2>/dev/null || grep -q '"swagger"' "$file" 2>/dev/null; then
                    return 0
                fi
            else
                if grep -q "openapi:" "$file" 2>/dev/null || grep -q "swagger:" "$file" 2>/dev/null; then
                    return 0
                fi
            fi
            ;;
    esac
    return 1
}

# Function to generate title from filename
generate_title() {
    filepath="$1"
    filename=$(basename "$filepath")
    name="${filename%.*}"
    dirname=$(dirname "$filepath")

    if [ "$dirname" != "$MOUNT_DIR" ] && [ "$dirname" != "." ]; then
        parent_dir=$(basename "$dirname")
        echo "${parent_dir} - ${name}"
    else
        echo "$name"
    fi
}

# Function to generate slug from filename
generate_slug() {
    filepath="$1"
    filename=$(basename "$filepath")
    name="${filename%.*}"
    dirname=$(dirname "$filepath")

    if [ "$dirname" != "$MOUNT_DIR" ] && [ "$dirname" != "." ]; then
        parent_dir=$(basename "$dirname")
        echo "${parent_dir}-${name}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g'
    else
        echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g'
    fi
}

# Function to escape JSON strings
escape_json() {
    echo "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

# Build sources array
SOURCES=""
FIRST=true

# Find and process OpenAPI documents using a temporary file for POSIX compatibility
TEMP_FILE=$(mktemp)
find "$MOUNT_DIR" -type f \( -name "*.json" -o -name "*.yaml" -o -name "*.yml" \) -print0 > "$TEMP_FILE"

while IFS= read -r -d '' file; do
    if is_openapi_doc "$file"; then
        relative_path="${file#$MOUNT_DIR/}"
        title=$(generate_title "$file")
        slug=$(generate_slug "$file")
        url="${BASE_URL}/${relative_path}"

        # Escape for JSON
        escaped_title=$(escape_json "$title")
        escaped_slug=$(escape_json "$slug")
        escaped_url=$(escape_json "$url")

        # Found OpenAPI document: $relative_path -> $title ($slug)

        # Add comma if not first
        if [ "$FIRST" = "false" ]; then
            SOURCES="${SOURCES},"
        fi

        # Set first doc as default
        if [ "$FIRST" = "true" ]; then
            default="true"
            FIRST=false
        else
            default="false"
        fi

        # Add source
        SOURCES="${SOURCES}{\"title\":\"${escaped_title}\",\"slug\":\"${escaped_slug}\",\"url\":\"${escaped_url}\",\"default\":${default}}"
    fi
done < "$TEMP_FILE"

# Clean up temporary file
rm -f "$TEMP_FILE"

# Generate final JSON
if [ -n "$SOURCES" ]; then
    echo "{\"sources\":[${SOURCES}]}" > "$CONFIG_FILE"
else
    echo "No OpenAPI documents found"
    echo '{"sources":[]}' > "$CONFIG_FILE"
fi
