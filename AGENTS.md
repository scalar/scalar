# AGENTS.md - AI Agent Guide for Scalar

This file helps AI coding agents (Cursor, Claude Code, GitHub Copilot, etc.) work effectively in the Scalar codebase. It is the canonical agent guide for this repository.

## Project Overview

Scalar is a Vue 3 + TypeScript monorepo for API documentation and testing.

- It produces `@scalar/api-reference` (renders OpenAPI docs) and `@scalar/api-client` (API testing client)
- It includes 40+ supporting packages and 18 framework integrations (Express, Fastify, Hono, NestJS, Next.js, Nuxt, etc.)
- It uses pnpm workspaces, Turbo for build orchestration, Vite for Vue packages, and esbuild for pure TypeScript packages

- **Frontend**: Vue 3, Composition API, TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: ESLint (Vue) + Biome (TS)

## Prerequisites

- **Node.js**: v24 (see `.nvmrc`)
- **Package manager**: pnpm (v10.16.1+)

## First-Time Setup

```bash
pnpm install
pnpm build:packages
```

## Commands

```bash
pnpm install                    # Install dependencies
pnpm build:packages             # Build all packages (required before first dev)
pnpm clean:build                # Clean everything, reinstall, rebuild
```

## Key Commands

| Task | Command |
|------|---------|
| Build all packages | `pnpm build:packages` |
| Build integrations | `pnpm build:integrations` |
| Clean build | `pnpm clean:build` |
| Run unit tests | `pnpm test` |
| Run tests (single package, single run) | `pnpm vitest packages/helpers --run` |
| Run tests (single package, watch mode) | `pnpm vitest packages/api-client` |
| Run tests filtered by name | `pnpm test your-test-name` |
| Lint check | `pnpm lint:check` |
| Lint fix | `pnpm lint:fix` |
| Format | `pnpm format` |
| Type check | `pnpm types:check` |

## Development Servers

There is no single root `pnpm dev`. Run per package:

```bash
pnpm --filter @scalar/api-client dev
pnpm --filter @scalar/api-reference dev
pnpm --filter @scalar/components dev
```

| Package | Purpose |
|---------|---------|
| `api-client` | API testing client playground |
| `api-reference` | Main API reference playground |
| `components` | Storybook (port 5100) |
| `void-server` | HTTP mirror server (port 5052) |

## Test Servers

Some tests need `@scalar/void-server` (5052) and `proxy-scalar-com` (5051):

```bash
pnpm script run test-servers
pnpm script wait -p 5051 5052
```

## Architecture

### Workspace Layout

- `packages/` - Core libraries (45 packages). Each is an npm package under `@scalar/`.
- `integrations/` - Framework-specific wrappers (Express, Fastify, Next.js, Nuxt, etc.)
- `projects/` - Deployable apps (`scalar-app`, `proxy-scalar-com`, `client-scalar-com`)
- `examples/` - Usage examples for various frameworks
- `tooling/` - Internal build scripts and changelog generator

## Directory Structure

```text
packages/      # Core packages (@scalar/*)
integrations/  # Framework integrations (Express, FastAPI, etc.)
examples/      # Example apps
projects/      # Supporting projects (e.g. proxy-scalar-com)
tooling/       # Internal scripts and build helpers
```

### Build System

Two build strategies use standard tools directly (no custom build CLI):

1. **`tsc` + `tsc-alias`**
   - For pure TypeScript packages (helpers, types, openapi-parser, integrations)
   - Uses `tsconfig.build.json` per package
2. **`vite build`**
   - For Vue component packages (`components`, `api-reference`, `api-client`)
   - Uses Vite 8 + Rolldown, extracts CSS, preserves modules
   - Shared build helpers live in `tooling/scripts/vite-lib-config.ts`

Both strategies externalize dependencies (nothing is bundled into library output). `api-reference` is special because it has both a default build and a standalone build (`vite.standalone.config.ts`) that bundles everything for CDN usage.

Type checking uses `tsc --noEmit` (pure TS) or `vue-tsc --noEmit` (Vue packages).

### Key Package Relationships

- `@scalar/core` - Shared rendering logic consumed by `api-reference` and integrations
- `@scalar/themes` - CSS variables and design tokens used across UI packages
- `@scalar/components` - Vue component library (with Storybook)
- `@scalar/oas-utils` - OpenAPI utilities shared across `api-reference` and `api-client`
- `@scalar/types` - Shared TypeScript types; import from specific entry points (`@scalar/types/api-reference`, etc.), not the root

### Dependency Versioning

All workspace packages use `workspace:*` for internal dependencies. Shared third-party versions are defined in `pnpm-workspace.yaml` under `catalogs:` and referenced as `catalog:*` in `package.json` files.

### Tooling Split

- **Biome**: Linting and formatting for `.ts` files
- **ESLint**: Linting for `.vue` files
- **Prettier**: Formatting for `.vue`, `.md`, `.json`, `.css`, `.html`, `.yml` files
- **Lefthook**: Pre-commit hooks running Prettier + Biome on staged files

## Code Standards

### Reuse helpers before writing new ones

Before writing a new utility function, check `@scalar/helpers` (`packages/helpers/src/`) first. It already covers a wide range of common needs, organized by category:

| Category | Examples |
|----------|---------|
| `array` | array manipulation utilities |
| `dom` | DOM helpers |
| `errors` | error handling utilities |
| `file` | file utilities |
| `formatters` | value formatting |
| `general` | miscellaneous general utilities |
| `http` | HTTP methods, headers, status codes, MIME types |
| `json` | JSON pointer helpers, pretty-print |
| `markdown` | heading extraction |
| `object` | deep equality, key helpers, path access, local storage |
| `queue` | async queue |
| `regex` | variable finding/replacing |
| `string` | capitalize, hash, truncate, camel-to-title |
| `testing` | sleep, measure, console spies |
| `url` | URL validation, merging, proxy helpers |

If the helper you need already exists there, import it from `@scalar/helpers`. Only add a new helper to `@scalar/helpers` (or another package) if nothing suitable already exists.

### TypeScript

- Prefer `type` over `interface`
- Use explicit return types for functions
- Avoid `any`; use `unknown` when the type is unclear
- Avoid enums; use string literal unions
- Use `const` instead of `let` whenever possible
- Use `type` keyword for type-only imports (`import type { Foo }`)
- Prefer arrow functions over function declarations
- Use single quotes, trailing commas, and semicolons only as needed

### Vue Components

- Use Composition API with `<script setup lang="ts">`
- Use Tailwind CSS utility classes for styling
- Destructure props: `const { prop1, prop2 = 'default' } = defineProps<Props>()`
- Explicitly type `defineProps` and `defineEmits`
- Keep templates clean; use computed properties over inline logic
- Recommended `<script setup>` order: imports, props/emits, state/computed/methods, lifecycle hooks

### Comments and Docs

- Explain **why**, not what
- Use a friendly, human tone
- Avoid contractions (use "do not" instead of "don't")
- Add JSDoc for exported types and functions
- Leave TODO comments for temporary solutions

## Testing

- **Unit tests**: Vitest, `*.test.ts` next to source
- **E2E**: Playwright in `packages/api-reference` and `packages/components`
- **Integration tests**: `pnpm vitest integrations/*`

### Testing Standards

- Always import `describe`, `it`, and `expect` explicitly from `vitest` (no globals)
- Place test files as `name.test.ts` alongside source
- Keep top-level `describe()` matching the file name
- Do not start test descriptions with "should" (`it('generates a slug')`, not `it('should generate a slug')`)
- Minimize mocking; prefer pure functions
- For Vue component tests, verify behavior, not DOM structure or Tailwind class details

### Biome Lint Rules to Know

- `noBarrelFile: error` - No barrel files (except `index.ts` entry points)
- `noReExportAll: warn` - Avoid `export * from` (error in `api-reference` and `openapi-parser`)
- `noTsIgnore: error` - No `@ts-ignore` (use `@ts-expect-error` with explanation if needed)
- `useAwait: error` - Async functions must use `await`
- `noExportsInTest: error` - Do not export from test files
- `noFloatingPromises: warn` - Handle all promises

## Git Workflow

### Branch Naming

- `claude/feature-description` - New features
- `claude/fix-description` - Bug fixes
- `claude/chore-description` - Maintenance

### Commit Messages

- Use conventional commits, for example: `feat(api-client): add new endpoint`
- Use present tense ("add" instead of "added")
- Prefer scope when relevant

## PR Requirements

### Semantic PR titles

PR titles must follow `type(scope): subject`:

```text
fix(api-client): crashes when API returns null
^   ^            ^
|   |            subject
|   package scope
type (feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert)
```

### Ticket and issue linking

When a **Linear ticket** ID (e.g. `DOC-5102`, `ENG-123`) or a **GitHub issue** number/URL is provided in the prompt, instructions, or related Slack thread, link it in the PR so project-management integrations can track progress automatically.

If a GitHub issue number is available, include it in the PR description using `See #123` (non-closing) or `Fixes #123` (auto-closing on merge).

#### Linear tickets

Include the Linear issue ID in the branch name or PR description using a magic word. Do **not** put the issue ID in the PR title.

**Closing magic words**:
`close`, `closes`, `closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves`, `resolved`

**Non-closing magic words**:
`ref`, `refs`, `references`, `part of`, `related to`, `contributes to`, `toward`, `towards`

Examples:

```text
Fixes DOC-5102
Part of ENG-123
Resolves DOC-5102, ENG-456
```

You can also use full Linear URLs, for example:
`Fixes https://linear.app/scalar/issue/DOC-5102/title`.

To link multiple issues:
`Fixes ENG-123, DES-5, ENG-256`.

#### GitHub issues

Use GitHub closing keywords in the PR description to link and auto-close issues on merge:
`close`, `closes`, `closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves`, `resolved`

| Scenario | Syntax | Example |
|----------|--------|---------|
| Same repository | `KEYWORD #ISSUE` | `Closes #42` |
| Different repository | `KEYWORD OWNER/REPO#ISSUE` | `Fixes scalar/scalar#100` |
| Multiple issues | Repeat full syntax | `Resolves #10, resolves #42` |

#### Where to place the link

Add a `## Ticket` section at the bottom of the PR description:

```markdown
## Ticket

Fixes DOC-5102
Closes #42
```

If both a Linear ticket and a GitHub issue are provided, include both.

> Tip: Magic words must appear in the PR description (not PR comments) for Linear detection. For GitHub issues, keywords work in both PR descriptions and commit messages.

### Changesets

For code changes in `packages/*` and `integrations/*`, include a changeset using `patch` or `minor` (do not use `major`).

Before opening or updating a PR, run:

```bash
pnpm changeset status
```

If a package version should bump, add a changeset:

```bash
pnpm changeset
```

### After-change checklist

After making **any** code changes, run lint, format, and type-check scoped to only the files and packages you touched. Do not run whole-repo checks.

**1. Lint and format only the changed files:**

```bash
# Collect the files you changed (adjust the revision as needed)
CHANGED=$(git diff --name-only HEAD)

# Biome: lint + format TypeScript/JS files
pnpm biome check --write --diagnostic-level=error --no-errors-on-unmatched --files-ignore-unknown=true $CHANGED

# Prettier: format Vue, Markdown, JSON, CSS, YAML, and other non-TS files
pnpm prettier --write $CHANGED
```

**2. Type-check only the affected package(s):**

```bash
# Replace <package-name> with the actual package (e.g. api-client, helpers, oas-utils)
pnpm --filter @scalar/<package-name> types:check
```

Then, before opening or updating a PR, also run:

```bash
pnpm knip          # Detect unused exports, files, and dependencies
```

> All checks must pass cleanly. Do not commit code that has lint errors, type errors, or unused exports.

## Visual Testing

When making UI changes, PRs must include visual artifacts (screenshots and/or demo videos) demonstrating impact. Most package dependencies trickle up into three main visual surfaces: `api-reference`, `api-client`, and `components`.

### Prerequisites

Build all packages before running any playground:

```bash
pnpm install
pnpm build:packages
```

Alternatively, `pnpm turbo dev` or `pnpm turbo build` in a package directory can auto-build upstream dependencies.

### Playgrounds

Each playground can be started with `pnpm dev` inside its package directory, or from repo root with Turbo:

| Package | Quick start | Turbo | Details |
|---------|-------------|-------|---------|
| `api-reference` | `cd packages/api-reference && pnpm dev` | `pnpm turbo --filter @scalar/api-reference dev` | [`AGENTS.md`](./packages/api-reference/AGENTS.md) |
| `api-client` | `cd packages/api-client && pnpm dev` | `pnpm turbo --filter @scalar/api-client dev` | [`AGENTS.md`](./packages/api-client/AGENTS.md) |
| `components` | `cd packages/components && pnpm dev` | `pnpm turbo --filter @scalar/components dev` | [`AGENTS.md`](./packages/components/AGENTS.md) |

The `api-client` has multiple layouts (web, app, modal) - see its package `AGENTS.md` for details.

### Which playground to use

| Change area | Primary playground | Secondary |
|-------------|--------------------|-----------|
| Base components (buttons, inputs, modals) | `components` Storybook | `api-reference`, `api-client` |
| Themes, CSS variables, design tokens | `api-reference` | `api-client`, `components` |
| Sidebar, search, OpenAPI rendering | `api-reference` | `api-client` |
| Request editor, response viewer, auth | `api-client` (web + app) | `api-reference` (modal via "Test Request") |
| Code highlighting, snippets | `api-reference` | `api-client` |
| Icons | `components` Storybook | `api-reference` |

### Artifact guidelines for PRs

When making UI changes, embed artifacts directly in the PR description. Cursor Cloud Agents can upload these when referenced as absolute paths.

#### How it works

1. Save artifacts to `/opt/cursor/artifacts/` using descriptive snake_case names.
2. Reference artifacts in PR descriptions with absolute HTML paths.
3. Use the `ManagePullRequest` tool to create/update PR descriptions.

Example:

```html
<img src="/opt/cursor/artifacts/screenshot_before.png" alt="Before change" />
<img src="/opt/cursor/artifacts/screenshot_after.png" alt="After change" />
<video src="/opt/cursor/artifacts/demo_feature.mp4" controls></video>
```

#### What to capture

- Before and after screenshots for modified UI
- In-context screenshots for new features
- Artifacts from the most relevant playground
- Artifacts from multiple playgrounds if the change spans surfaces
- Demo videos for interactive behavior

#### PR description format

Add a `## Visual` section:

```markdown
## Visual

<img src="/opt/cursor/artifacts/screenshot_before.png" alt="Before" />
<img src="/opt/cursor/artifacts/screenshot_after.png" alt="After" />
<video src="/opt/cursor/artifacts/demo_feature.mp4" controls></video>
```

## OpenAPI Terminology

Use consistent terminology:

- **OpenAPI** (not "Swagger") - specification format
- **API description** (not "API spec" or "API definition") - metadata document
- **Schema** - data model for request/response shapes
- **Dereference** - replace all `$ref` with their values
- **Bundle** - pull external `$ref` values into a single file
- **Resolve** - look up value at a `$ref` without modifying the document

## Cursor Cloud specific instructions

### Environment

- **Node.js v24** is managed via nvm. The update script handles installation automatically.
- **pnpm v10.16.1** is activated via corepack. No global install needed.
- After `pnpm install`, you may see a warning about ignored esbuild build scripts. This is safe to ignore — Vite 8 uses Rolldown and the build succeeds without esbuild's platform binary.

### Running dev servers

- There is no single root `pnpm dev`. Start the specific package you need (see the Key Commands table above).
- `pnpm --filter @scalar/api-reference dev` starts on **port 5173**.
- `pnpm --filter @scalar/api-client dev` starts on a Vite-assigned port (check terminal output).
- All packages must be built first (`pnpm build:packages`) before running any dev server.

### Testing caveats

- Some packages have test failures related to `@/` path alias resolution in Vitest (e.g., `openapi-parser`, `snippetz`). These are pre-existing and not caused by environment issues.
- Tests that require network services need test servers running first: `pnpm script run test-servers` (starts void-server on port 5052 and proxy on port 5051).
- For a quick validation that the test framework works, run: `pnpm vitest packages/oas-utils --run`

### Lint and format

- `pnpm lint:check` runs Biome on all TS files. This is the primary lint command.
- For Vue files: `pnpm lint:vue` (ESLint).
- For formatting: `pnpm format:check` (Prettier + Biome format).

## Further Reading

- [CONTRIBUTING.md](./CONTRIBUTING.md) - PR requirements, changesets, auto-generated files
- [.cursor/rules/cloud-agents-starter-skill.mdc](./.cursor/rules/cloud-agents-starter-skill.mdc) - Runbook for CI parity and test servers
