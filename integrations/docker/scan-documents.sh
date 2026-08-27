#!/bin/sh

# Document scanning script for Scalar Docker integration
# Scans mounted directories for OpenAPI documents and generates configuration

# Directory to scan and output file. Both default to the container paths but can be
# overridden via the environment, which keeps the script testable outside Docker.
MOUNT_DIR="${MOUNT_DIR:-/docs}"
# Optional URL prefix when serving under a subpath (for example, "/docs").
# Strip any trailing slash so the prefix concatenates cleanly.
BASE_PATH="${BASE_PATH%/}"
BASE_URL="${BASE_PATH}/openapi"
CONFIG_FILE="${CONFIG_FILE:-/tmp/configuration.json}"

echo "Scanning for OpenAPI and AsyncAPI documents in: $MOUNT_DIR"

# Check if mount directory exists
if [ ! -d "$MOUNT_DIR" ]; then
    printf '%s\n' '{"sources":[]}' > "$CONFIG_FILE"
    exit 0
fi

# Function to check if a file is an OpenAPI, Swagger, or AsyncAPI document
is_api_document() {
    file="$1"
    ext="${file##*.}"

    case "$ext" in
        json|yaml|yml)
            if [ "$ext" = "json" ]; then
                if grep -q '"openapi"' "$file" 2>/dev/null || grep -q '"swagger"' "$file" 2>/dev/null || grep -q '"asyncapi"' "$file" 2>/dev/null; then
                    return 0
                fi
            else
                if grep -q "openapi:" "$file" 2>/dev/null || grep -q "swagger:" "$file" 2>/dev/null || grep -q "asyncapi:" "$file" 2>/dev/null; then
                    return 0
                fi
            fi
            ;;
    esac
    return 1
}

# Function to generate title from filename.
# `printf '%s\n'` is used instead of `echo` so a filename containing a backslash
# sequence (for example "a\name.json") is not mangled by shells whose `echo`
# interprets backslash escapes.
generate_title() {
    filepath="$1"
    filename=$(basename "$filepath")
    name="${filename%.*}"
    dirname=$(dirname "$filepath")

    if [ "$dirname" != "$MOUNT_DIR" ] && [ "$dirname" != "." ]; then
        parent_dir=$(basename "$dirname")
        printf '%s\n' "${parent_dir} - ${name}"
    else
        printf '%s\n' "$name"
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
        printf '%s\n' "${parent_dir}-${name}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g'
    else
        printf '%s\n' "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g'
    fi
}

# Function to escape a string for embedding inside a JSON string literal.
# Order matters: backslashes are escaped first so the backslashes added when
# escaping the other characters are not doubled again.
# `printf '%s'` is used instead of `echo` because some POSIX shells (dash,
# busybox) let `echo` interpret backslash sequences in the value, which would
# corrupt a filename containing a backslash before it is ever escaped.
# Tabs and carriage returns are control characters that are invalid unescaped
# inside a JSON string; they are spelled out via `printf` because POSIX `sed`
# does not portably understand the "\t"/"\r" escapes. Newlines cannot reach here
# because the file list is newline delimited.
escape_json() {
    tab=$(printf '\t')
    cr=$(printf '\r')
    printf '%s' "$1" \
        | sed 's/\\/\\\\/g; s/"/\\"/g' \
        | sed "s/${tab}/\\\\t/g; s/${cr}/\\\\r/g"
}

# Build sources array
SOURCES=""
FIRST=true

# Find and process documents using a temporary file so the loop body runs in the
# current shell (a piped `while` would run in a subshell and lose SOURCES/FIRST).
# Use newline-delimited output and a plain `read`: `find -print0` paired with
# `read -d ''` is a bashism that fails under a POSIX `/bin/sh` such as dash, which
# is what CI uses. Document filenames do not contain newlines, so this is safe.
# `sort` makes the traversal order deterministic so the "first document is the
# default" selection below does not depend on the filesystem's directory order.
TEMP_FILE=$(mktemp)
find "$MOUNT_DIR" -type f \( -name "*.json" -o -name "*.yaml" -o -name "*.yml" \) | sort > "$TEMP_FILE"

while IFS= read -r file; do
    if is_api_document "$file"; then
        relative_path="${file#"$MOUNT_DIR"/}"
        title=$(generate_title "$file")
        slug=$(generate_slug "$file")
        # Historical path: kept as "/openapi" for both document types so existing deployments
        # don't need to change their mount/proxy setup. The Caddyfile serves the whole /docs
        # mount under this path regardless of document type.
        url="${BASE_URL}/${relative_path}"

        # Escape for JSON
        escaped_title=$(escape_json "$title")
        escaped_slug=$(escape_json "$slug")
        escaped_url=$(escape_json "$url")

        # Found document: $relative_path -> $title ($slug)

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

# Generate final JSON.
# `printf '%s\n'` is used instead of `echo` because SOURCES contains JSON escape
# sequences (`\"`, `\\`, `\t`) and some shells let `echo` re-interpret those
# backslashes, which would corrupt the escaping added by escape_json.
if [ -n "$SOURCES" ]; then
    printf '%s\n' "{\"sources\":[${SOURCES}]}" > "$CONFIG_FILE"
else
    echo "No documents found"
    printf '%s\n' '{"sources":[]}' > "$CONFIG_FILE"
fi
