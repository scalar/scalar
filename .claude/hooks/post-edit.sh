#!/bin/bash
# Post-edit hook - runs after Claude edits files
# Useful for auto-formatting or running quick checks

# Get the edited file from environment variable
EDITED_FILE="${EDITED_FILE_PATH}"

if [ -z "$EDITED_FILE" ]; then
    exit 0
fi

# Auto-format TypeScript and Vue files after editing
if [[ "$EDITED_FILE" =~ \.(ts|tsx|vue)$ ]]; then
    echo "🎨 Auto-formatting ${EDITED_FILE}..."

    # Run prettier for Vue files
    if [[ "$EDITED_FILE" =~ \.vue$ ]]; then
        npx prettier --write "$EDITED_FILE" 2>/dev/null || true
    fi

    # Run biome for TypeScript files
    if [[ "$EDITED_FILE" =~ \.(ts|tsx)$ ]]; then
        npx biome format --write "$EDITED_FILE" 2>/dev/null || true
    fi
fi

# Quick type check for TypeScript files (optional, can be slow)
# Uncomment if you want immediate feedback on type errors
# if [[ "$EDITED_FILE" =~ \.(ts|tsx)$ ]]; then
#     echo "🔍 Quick type check..."
#     npx tsc --noEmit "$EDITED_FILE" 2>/dev/null || echo "⚠️  Type check: Please run 'pnpm types:check'"
# fi

exit 0
