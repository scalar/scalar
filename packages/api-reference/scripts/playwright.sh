#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# This script is a wrapper around the Playwright CLI that runs in a Docker container.

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Configuration
readonly DOCKER_IMAGE_NAME="scalar-playwright-api-reference"
readonly DOCKERFILE_PATH="test/Dockerfile"
readonly PROJECT_ROOT="../../"
readonly CURRENT_DIR=$(pwd)

# Capture all arguments passed to the script
PLAYWRIGHT_ARGS="$@"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to run a command and print status
run_command() {
    local description=$1
    local command=$2

    print_status "$YELLOW" "🔄 $description..."
    eval "$command"
    print_status "$GREEN" "✅ $description completed"
}

# Function to detect if we're on Linux
is_linux() {
    [[ "$OSTYPE" == "linux-gnu"* ]]
}

# Function to run playwright directly on Linux
run_playwright_directly() {
    print_status "$GREEN" "🚀 Running Playwright directly on Linux..."

    # Build the project using turbo
    run_command "Building project with turbo" \
        "pnpm turbo --filter @scalar/api-reference... build"

    # Run playwright directly
    print_status "$YELLOW" " Running Playwright with args: $PLAYWRIGHT_ARGS"
    pnpm playwright $PLAYWRIGHT_ARGS

    print_status "$GREEN" "✅ Playwright execution completed successfully!"
}

# Function to run playwright in Docker
run_playwright_in_docker() {
    print_status "$GREEN" "🚀 Running Playwright in Docker..."

    # Build the project using turbo
    run_command "Building project with turbo" \
        "pnpm turbo --filter @scalar/api-reference... build"

    # Build Docker image
    run_command "Building Docker image" \
        "docker build -f $DOCKERFILE_PATH $PROJECT_ROOT -t $DOCKER_IMAGE_NAME"

    # Run Docker container with Playwright
    print_status "$YELLOW" " Running Playwright with args: $PLAYWRIGHT_ARGS"

    docker run \
        -v "$CURRENT_DIR/dist:/app/packages/api-reference/dist" \
        -v "$CURRENT_DIR/test/snapshots:/app/packages/api-reference/test/snapshots" \
        -v "$CURRENT_DIR/test-results:/app/packages/api-reference/test-results" \
        "$DOCKER_IMAGE_NAME" \
        bash -c "pnpm playwright $PLAYWRIGHT_ARGS"

    print_status "$GREEN" "✅ Playwright execution completed successfully!"
}

# Main execution
main() {
    if is_linux; then
        run_playwright_directly
    else
        run_playwright_in_docker
    fi
}

# Run the main function
main "$@"
