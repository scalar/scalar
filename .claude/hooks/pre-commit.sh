#!/bin/bash
# Pre-commit hook - runs before git commits
# Ensures code quality standards are met

set -e  # Exit on first error

echo "🔍 Running pre-commit checks..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in project root directory"
    exit 1
fi

# Format check
echo "  → Checking code formatting..."
if ! pnpm format:check > /dev/null 2>&1; then
    echo "❌ Format check failed. Running auto-fix..."
    pnpm format
    echo "✅ Code formatted. Please review changes."
fi

# Lint check
echo "  → Checking lint rules..."
if ! pnpm lint:check > /dev/null 2>&1; then
    echo "❌ Lint check failed. Running auto-fix..."
    pnpm lint:fix
    echo "✅ Lint issues fixed. Please review changes."
fi

# Type check
echo "  → Checking TypeScript types..."
if ! pnpm types:check; then
    echo "❌ Type check failed. Please fix type errors before committing."
    exit 1
fi

echo "✅ All pre-commit checks passed!"
exit 0
