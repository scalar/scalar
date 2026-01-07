#!/bin/bash
# This hook runs before Claude processes user prompts
# Useful for validating commands or providing context

# Exit codes:
# 0 = Allow the prompt
# 1 = Block the prompt with error message

# Example: Warn about dangerous operations
if echo "$PROMPT" | grep -qiE "(rm -rf|delete all|drop database)"; then
    echo "⚠️  Warning: This prompt contains potentially dangerous operations."
    echo "Please review carefully before proceeding."
    # Still allow (exit 0), but with warning
    exit 0
fi

# Reminder for monorepo commands
if echo "$PROMPT" | grep -qiE "(npm install|yarn add)" | grep -qv "pnpm"; then
    echo "💡 Reminder: This is a pnpm monorepo. Use 'pnpm' instead of npm/yarn."
    echo "   Example: pnpm install, pnpm add"
    # Still allow, but educate
    exit 0
fi

# Allow all other prompts
exit 0
