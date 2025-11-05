# @scalar-internal/build-scripts

Internal CLI to quickly run repository scripts for the Scalar monorepo.

This tool provides a collection of commands to help manage packages, run tests, update dependencies, and perform various maintenance tasks across the workspace.

## Installation

This is an internal tool used within the Scalar monorepo. To use it, run commands via pnpm:

```bash
pnpm --filter @scalar-internal/build-scripts start <command>
```

Or use the shorthand script if available:

```bash
pnpm scripts <command>
```

## Commands

### `packages format`

Format and validate all `package.json` files in the workspace.

This command:
- Formats `package.json` files in `packages/`, `integrations/`, `projects/`, and `examples/` directories
- Sorts keys according to a predefined order
- Validates required fields (license, author, repository, etc.)
- Ensures packages are ESM modules (with exceptions)
- Validates required scripts exist
- Ensures peer dependencies are installed as dev dependencies

**Usage:**
```bash
pnpm --filter @scalar-internal/build-scripts start packages format
```

### `packages outdated [packages...]`

Check for outdated packages in the workspace catalog.

This command checks all packages in the `pnpm-workspace.yaml` catalogs and reports which ones have newer versions available. You can optionally filter by package name patterns using glob patterns.

**Usage:**
```bash
# Check all packages
pnpm --filter @scalar-internal/build-scripts start packages outdated

# Check specific packages using glob patterns
pnpm --filter @scalar-internal/build-scripts start packages outdated "commander" "prettier*"
```

The output shows:
- Package name
- Current version
- Latest available version
- Color-coded version difference (major/minor/patch)

### `packages update <packages...>`

Update packages in the workspace catalog to their latest versions.

This command updates the specified packages in `pnpm-workspace.yaml` to their latest available versions. Use glob patterns to match multiple packages.

**Usage:**
```bash
# Update specific packages
pnpm --filter @scalar-internal/build-scripts start packages update "commander" "prettier"

# Update all packages matching a pattern
pnpm --filter @scalar-internal/build-scripts start packages update "prettier*"
```

After updating, run `pnpm install` to install the new versions.

### `wait -p, --ports <ports...>`

Wait for services to start on specified ports.

This command polls HTTP endpoints on the given ports until they respond successfully, or times out after 30 seconds. Useful for waiting for test servers or other services to be ready.

**Usage:**
```bash
# Wait for a single port
pnpm --filter @scalar-internal/build-scripts start wait -p 3000

# Wait for multiple ports
pnpm --filter @scalar-internal/build-scripts start wait -p 3000 3001 8080
```

The command will:
- Ping each port every second
- Exit with code 0 when all ports are ready
- Exit with code 1 if any port doesn't respond within 30 seconds

### `update-snapshots`

Update Playwright test snapshot files.

This command processes Playwright test results and updates snapshot files for the CDN API Reference tests. It's intended to be run in the `test-cdn-jsdelvr.yml` GitHub Actions workflow.

**Usage:**
```bash
pnpm --filter @scalar-internal/build-scripts start update-snapshots
```

The command:
- Reads test results from `playwright/test-results/`
- Filters out retry reports
- Copies actual snapshots to the snapshot folder
- Renames files with browser name and platform (linux/macos)

### `cat`

Test terminal color output (debugging utility).

This command displays a colorful ASCII art cat and demonstrates all available terminal color outputs. Useful for testing terminal color support and debugging color-related issues.

**Usage:**
```bash
pnpm --filter @scalar-internal/build-scripts start cat
```

### `run test-servers`

Run test servers concurrently.

This command starts both the void-server and proxy-server test servers in parallel using `concurrently`. Useful for local development and testing.

**Usage:**
```bash
pnpm --filter @scalar-internal/build-scripts start run test-servers
```

The command runs:
- `@scalar/void-server` on its default port
- `proxy-scalar-com` on its default port

Both servers run with `CI=1` environment variable set.

### `update-playwright-docker`

Update the Playwright Docker images to the latest version.

This command builds and pushes Docker images for Playwright testing. It creates two images:
- `scalarapi/playwright:${version}` - Base Playwright image
- `scalarapi/playwright-runner:${version}` - Runner image

**Usage:**
```bash
pnpm --filter @scalar-internal/build-scripts start update-playwright-docker
```

**Note:** This command requires Docker to be installed and configured, and you must have push access to the `scalarapi` Docker Hub organization.

### `generate-readme`

Generate README.md files for packages with readme metadata.

This command scans all packages in `packages/` and `integrations/` directories, finds those with `readme` metadata in their `package.json`, and generates standardized README.md files.

**Usage:**
```bash
pnpm --filter @scalar-internal/build-scripts start generate-readme
```

The generated README includes:
- Title from metadata
- Badges (npm, pypi, nuget, docker, crates.io) based on package type
- Package description
- Documentation link
- Optional extra content
- Changelog link (if CHANGELOG.md exists)
- Community section
- License section

**Package.json metadata format:**
```json
{
  "readme": {
    "title": "Package Name",
    "badges": [
      { "type": "npm-version" },
      { "type": "npm-downloads" },
      { "type": "pypi-version", "package": "package-name" }
    ],
    "documentation": "https://docs.example.com",
    "extraContent": {
      "headline": "Additional Info",
      "content": "Some extra content here"
    }
  }
}
```
