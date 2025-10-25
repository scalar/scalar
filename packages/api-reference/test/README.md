# Scalar Reference End to End Testing

This directory contains end to end testing infrastructure for the API references package including automated snapshot testing using Playwright.

## Overview

The testing setup uses Playwright to capture visual snapshots of different parts of the API reference and to conduct end to end testing of it's features.

## How It Works

1. **Docker Container**: Playwright runs in a Docker container for consistent cross-platform results (and to be consistent with CI)
2. **Visual Regression Detection**: Playwright compares screenshots against stored snapshots to detect changes
3. **End to End test**: Playwright uses a hono server to test the configurations and features of the API references.

## Running Tests

### Non-Linux Systems

On non-Linux systems (e.g. macOS, Windows) you need to access to a docker implementation that supports the `--network=host` flag. Docker Desktop on macOS and Windows does not support this flag so you will need to use an alternative such as [OrbStack](https://orbstack.dev/).

### Fetching the Image

The tests run using the `scalarapi/playwright:1.56.0` Docker image. Sometimes the `test:e2e` script will not successfully pull the image (it looks like it does but it doesn't). You can force the pull by running:

```bash
pnpm test:e2e:playwright
```

### Local Development

The Playwright browser is run in a Docker container to have consistent results with CI. In order to run the test locally or update snapshots you **must** have Docker set up on your system. 

```bash
# Run tests (starts Docker container automatically)
pnpm test:e2e

# Update snapshots
pnpm test:e2e:update
```

### Debugging Tests

Run the playwright UI to debug your tests

```bash
pnpm test:e2e:ui
```

### CI/CD

Tests run automatically in CI using the same Docker container for consistency. The CI environment:
- Uses the containerized Playwright setup
- Compares snapshots against committed baseline images
- Fails the build if visual regressions are detected
