#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

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

# Main execution
main() {
    print_status "$GREEN" "🚀 Starting snapshot update process..."

    # Build the project using turbo
    run_command "Building project with turbo" \
        "pnpm turbo --filter @scalar/api-reference... build"

    # Build Docker image
    run_command "Building Docker image" \
        "docker build -f $DOCKERFILE_PATH $PROJECT_ROOT -t $DOCKER_IMAGE_NAME"

    # Run Docker container to update snapshots
    print_status "$YELLOW" "📸 Running Playwright tests to update snapshots..."

    docker run \
        -v "$CURRENT_DIR/dist:/app/packages/api-reference/dist" \
        -v "$CURRENT_DIR/test/snapshots:/app/packages/api-reference/test/snapshots" \
        "$DOCKER_IMAGE_NAME" \
        bash -c "pnpm playwright test snapshots --update-snapshots"

    print_status "$GREEN" "✅ Snapshot update completed successfully!"
}

# Run the main function
main "$@"
