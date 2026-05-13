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

### `generate-blog`

Generate blog index post rows and update `scalar.config.json` from post files.

Scans `documentation/blog/` for markdown files matching `YYYY-MM-DD-slug.md`, then:
- Rewrites the auto-generated post list section (between `<!-- generated -->` / `<!-- /generated -->` markers) in `documentation/blog/index.md`. Existing summaries are preserved and normalized for concise list rows.
- Updates `/blog` navigation in `scalar.config.json`, converting `/blog` to a single page entry with a books icon, generating hidden `/blog/posts/*` routes, and preserving custom titles plus page-level head scripts.

**Usage:**
```bash
pnpm --filter @scalar-internal/build-scripts start generate-blog
```

### `release-notes-generator`

Turn a Changesets-style `CHANGELOG.md` section into an AI-written, user-facing release note and append it to the package's `RELEASE_NOTES.json`. The JSON file is the source of truth that the Scalar app bundles and imports directly to power the in-app "What's new" modal - no runtime markdown parsing.

A derived `RELEASE_NOTES.md` is also regenerated from the same JSON when the optional `--markdown` flag is passed, so humans browsing the repo still see a friendly view.

The command runs as part of `pnpm changeset version` in CI (via the root `release:version` script), so the new entry lands in the same "chore: release" pull request as the `CHANGELOG.md` and version bumps and ships inside the published build - no separate publish step, no remote storage to keep in sync.

**What it does:**
1. Reads the section of a package's `CHANGELOG.md` that was added by `pnpm changeset version`.
2. Optionally reads the just-released sections of one or more dependency `CHANGELOG.md` files and folds them into the same release note as additional context. Useful when the parent package is a thin shell over a dependency (for example `scalar-app` on top of `@scalar/api-client`).
3. Pulls the title and description of every PR referenced from those sections so the model has the human-written context, not just the one-line commit subject.
4. Asks Anthropic Claude to summarise the result in the same Linear-style tone used by `projects/scalar-app/RELEASE_NOTES.json`.
5. Validates the model output against a Zod schema mirroring the app's `ReleaseNote` type.
6. Inserts the generated note into `RELEASE_NOTES.json` (creating it if missing). Re-running for the same version replaces the previous entry in place, so the operation is idempotent.
7. When `--markdown <path>` is provided, regenerates that file from the freshly merged JSON entries so the human-friendly view stays in lock-step with the source of truth.

**Usage:**
```bash
ANTHROPIC_API_KEY=sk-ant-... \
  pnpm --filter @scalar-internal/build-scripts start release-notes-generator \
    --package scalar-app \
    --changelog projects/scalar-app/CHANGELOG.md \
    --output projects/scalar-app/RELEASE_NOTES.json \
    --markdown projects/scalar-app/RELEASE_NOTES.md \
    --dependency-changelog packages/api-client/CHANGELOG.md
```

The version is auto-detected from the `package.json` next to `--changelog`. Pass `--version 1.1.0` explicitly to override it.

`--output` (`-o`) is the path to the source-of-truth `RELEASE_NOTES.json`. The Scalar app imports this file directly, so editing it by hand is supported - the next generator run will preserve every entry except the one matching the released version, which is replaced in place.

`--markdown` (`-m`) is optional. When provided, the command re-emits a derived markdown view at that path from the same merged-and-sorted JSON entries. Edits made to the markdown will be overwritten on the next release.

`--dependency-changelog` (`-d`) accepts any number of paths. Each one must sit next to a `package.json` so the command can read the just-bumped version and pull the matching `## <version>` section. Each dependency uses its own version, since Changesets bumps every package independently inside the same release. Missing files or sections are skipped with a warning rather than failing the run.

Add `--dry-run` to print the generated note without touching the files on disk.

### `sync-release-notes-markdown`

Rewrite the derived `RELEASE_NOTES.md` from an existing `RELEASE_NOTES.json` only. Use this after hand-editing the JSON so the markdown mirror stays in sync without running the AI generator or reading `CHANGELOG.md`.

**Usage:**
```bash
pnpm --filter @scalar-internal/build-scripts start sync-release-notes-markdown \
  --json projects/scalar-app/RELEASE_NOTES.json \
  --markdown projects/scalar-app/RELEASE_NOTES.md
```

The command preserves the order of entries exactly as they appear in the JSON file. It exits with an error if the JSON file is missing, not valid JSON, not a root-level array, or contains no valid entries after schema validation (warnings are printed for individual bad entries when at least one entry is still valid).

**Authentication:**
- **Anthropic** - reads `ANTHROPIC_API_KEY` from the environment. When the variable is missing the command prints a warning and exits successfully so contributors and PR builds running `pnpm changeset version` locally without the secret are not blocked.
- **GitHub** - reads `GITHUB_TOKEN` from the environment to fetch PR titles and descriptions. The repo is public, so an unauthenticated call works too, but the 60 requests / hour / IP rate limit is easy to blow through in CI. Failures (no token, rate limited, network blip) degrade silently to a CHANGELOG-only prompt rather than failing the release pipeline.

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
- Optional image (if provided)
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
    "image": {
      "url": "https://example.com/image.png",
      "altText": "Screenshot of the package"
    },
    "extraContent": {
      "headline": "Additional Info",
      "content": "Some extra content here"
    }
  }
}
```
