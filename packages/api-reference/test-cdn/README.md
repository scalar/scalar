# Scalar API Reference Snapshot Testing

This directory contains automated snapshot testing infrastructure for Scalar API References.

## Overview

The testing setup uses Playwright to capture visual snapshots of different reference configuration and compares the snapshots of the current branch to snapshots of the CDN (`https://cdn.jsdelivr.net/npm/@scalar/api-reference`).

Because of variability between the latest released version and `main` there may be differences that are caused by other changes in `main` that aren't part of the current branch.

## How It Works

1. **Vite Dev Server**: The tests run the Vite dev server hosting the `index.html` and `cdn.html` files.
2. **Docker Container**: Playwright runs in a Docker container for consistent cross-platform results.
3. **CDN Snapshot Generation**: A screenshot is taken of the current `CDN` rendered reference.
4. **Visual Diff**: Playwright takes a screenshot of the local rendered reference and compares it to the CDN version.

## Running Tests

### Building Storybook

If you're not running the dev server Playwright will automatically run `pnpm dev`.

### Local Development

The Playwright browser is run in a Docker container to have consistent results with CI. In order to run the test locally you **must** have Docker set up on your system. 

```bash
# Run snapshot diff (starts Docker container automatically)
pnpm test:e2e:snapshots
```

### CI/CD

Tests run automatically in CI using the same Docker container for consistency. The CI environment:
- Uses the containerized Playwright setup
- Compares snapshots of the CDN to the current branch

> [!IMPORTANT]
> These tests will not fail the CI build because the snapshots don't match.
