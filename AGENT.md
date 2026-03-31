# AGENT.md - Unified AI Agent Guide for Scalar

This is the canonical guidance file for AI coding agents working in this repository.
`CLAUDE.md` and `AGENTS.md` should point to this file.

## Project Overview

Scalar is a Vue 3 + TypeScript monorepo for API documentation and testing. It produces
`@scalar/api-reference` (renders OpenAPI docs) and `@scalar/api-client` (API testing client),
plus many supporting packages and framework integrations.

- **Frontend**: Vue 3, Composition API, TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: ESLint (Vue) + Biome (TS)
- **Build orchestration**: pnpm workspaces + Turbo
- **Package build tools**: Vite (Vue packages), tsc + tsc-alias (pure TS packages), esbuild in selected tooling

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
pnpm build:integrations         # Build integrations
pnpm clean:build                # Clean everything, reinstall, rebuild

# Development (per-package, not root-level)
pnpm --filter @scalar/api-reference dev
pnpm --filter @scalar/components dev    # Storybook on port 5100
pnpm --filter @scalar/api-client dev

# Testing
pnpm test                               # All tests (watch mode)
pnpm vitest packages/helpers --run       # Single package, single run
pnpm vitest packages/api-client          # Single package, watch mode
pnpm vitest packages/api-client --run    # Single package, single run
pnpm test your-test-name                 # Filter by test name

# Some tests need test servers running first
pnpm script run test-servers             # Start void-server (5052) + proxy (5051)
pnpm script wait -p 5051 5052            # Wait for ports

# E2E (Playwright, per-package)
cd packages/api-reference && pnpm test:e2e
cd packages/components && pnpm test:e2e

# Code quality
pnpm format                     # Prettier (vue/md/json) + Biome (ts)
pnpm lint:check                 # Biome lint
pnpm lint:fix                   # Biome + ESLint auto-fix
pnpm types:check                # TypeScript checking via Turbo
```

## Development Servers

There is no single root `pnpm dev`. Run per package:

```bash
pnpm --filter @scalar/api-client dev
pnpm --filter api-reference dev
pnpm --filter components dev
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

- `packages/` - Core libraries. Each is an npm package under `@scalar/`.
- `integrations/` - Framework-specific wrappers (Express, Fastify, Next.js, Nuxt, etc.)
- `projects/` - Deployable apps (`scalar-app`, `proxy-scalar-com`, `client-scalar-com`)
- `examples/` - Usage examples for various frameworks
- `tooling/` - Internal build scripts and changelog generator

### Build System

Two build strategies use standard tools directly:

1. **`tsc` + `tsc-alias`** - For pure TypeScript packages (helpers, types, openapi-parser, integrations). Uses `tsconfig.build.json` per package.
2. **`vite build`** - For Vue component packages (components, api-reference, api-client). Uses Vite + Rolldown, extracts CSS, preserves modules. Shared helpers live in `tooling/scripts/vite-lib-config.ts`.

Both strategies externalize dependencies (library output does not bundle third-party dependencies).
`api-reference` has both a default build and a standalone build (`vite.standalone.config.ts`) for CDN usage.

Type checking uses `tsc --noEmit` (pure TS) or `vue-tsc --noEmit` (Vue packages).

### Key Package Relationships

- `@scalar/core` - Shared rendering logic consumed by api-reference and integrations
- `@scalar/themes` - CSS variables and design tokens used across all UI packages
- `@scalar/components` - Vue component library (with Storybook)
- `@scalar/oas-utils` - OpenAPI utilities shared across api-reference and api-client
- `@scalar/types` - Shared TypeScript types. Import from specific entry points (`@scalar/types/api-reference`, etc.), not the root.

### Dependency Versioning

All workspace packages use `workspace:*` for internal dependencies.
Shared third-party versions are defined in `pnpm-workspace.yaml` under `catalogs:` and referenced as `catalog:*` in package manifests.

### Tooling Split

- **Biome**: Linting and formatting for `.ts` files
- **ESLint**: Linting for `.vue` files
- **Prettier**: Formatting for `.vue`, `.md`, `.json`, `.css`, `.html`, `.yml` files
- **Lefthook**: Pre-commit hooks running Prettier + Biome on staged files

## Code Standards

### TypeScript

- Prefer `type` over `interface`
- Explicit return types for functions
- Avoid `any`; use `unknown` when the type is unclear
- Avoid enums; use string literal unions
- Always use `const` instead of `let`
- Use `type` keyword for type-only imports (`import type { Foo }`)
- Arrow functions are preferred over function declarations
- Single quotes, trailing commas, semicolons only as needed

### Vue Components

- Composition API with `<script setup lang="ts">`
- Use Tailwind CSS utility classes for styling
- Destructure props: `const { prop1, prop2 = 'default' } = defineProps<Props>()`
- Explicitly type `defineProps` and `defineEmits`
- Keep templates clean: use computed properties over inline logic
- `<script setup>` order: imports, props/emits, state/computed/methods, lifecycle hooks

### Comments

- Explain **why**, not what
- Friendly, human tone
- Avoid contractions (use "do not" instead of "don't")
- JSDoc for exported types and functions
- Leave TODO comments for temporary solutions

### Testing

- Vitest for unit tests, Playwright for E2E
- Always import `describe`, `it`, `expect` explicitly from `vitest` (no globals)
- Test files: `name.test.ts` alongside source
- Top-level `describe()` matches the file name
- Do not start test descriptions with "should": `it('generates a slug')` not `it('should generate a slug')`
- Minimize mocking; prefer pure functions
- Vue component tests: test behavior, not DOM structure or Tailwind classes

### Biome Lint Rules to Know

- `noBarrelFile: error` - No barrel files (except `index.ts` entry points)
- `noReExportAll: warn` - Avoid `export * from` (error in api-reference and openapi-parser)
- `noTsIgnore: error` - No `@ts-ignore` (use `@ts-expect-error` with explanation if needed)
- `useAwait: error` - Async functions must use `await`
- `noExportsInTest: error` - Do not export from test files
- `noFloatingPromises: warn` - Handle all promises

## Directory Structure

```text
packages/           # Core packages (@scalar/*)
integrations/       # Framework integrations (Express, FastAPI, etc.)
examples/           # Example apps
projects/           # Supporting projects (e.g. proxy-scalar-com)
```

## Git Workflow

### Branch Naming

- `claude/feature-description` - New features
- `claude/fix-description` - Bug fixes
- `claude/chore-description` - Maintenance

### Commit Messages

- Conventional commits: `feat(api-client): add new endpoint`
- Present tense ("add" not "added")

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

### Changesets

If your PR causes a version bump for any package, add a changeset:

```bash
pnpm changeset
```

## Visual Testing

When making changes that affect the UI, PRs must include visual artifacts (screenshots and/or demo videos).
Most package dependencies trickle up into three main visual surfaces: `api-reference`, `api-client`, and `components`.

### Prerequisites

Build all packages before running any playground:

```bash
pnpm install
pnpm build:packages
```

Alternatively, run `pnpm turbo dev` or `pnpm turbo build` in a package directory to auto-build upstream dependencies.

### Playgrounds

| Package | Quick start | Turbo | Details |
|---------|------------|-------|---------|
| `api-reference` | `cd packages/api-reference && pnpm dev` | `pnpm turbo --filter @scalar/api-reference dev` | [`AGENTS.md`](./packages/api-reference/AGENTS.md) |
| `api-client` | `cd packages/api-client && pnpm dev` | `pnpm turbo --filter @scalar/api-client dev` | [`AGENTS.md`](./packages/api-client/AGENTS.md) |
| `components` | `cd packages/components && pnpm dev` | `pnpm turbo --filter @scalar/components dev` | [`AGENTS.md`](./packages/components/AGENTS.md) |

The `api-client` has multiple layouts (web, app, modal). See its package `AGENTS.md`.

### Which playground to use

| Change area | Primary playground | Secondary |
|-------------|-------------------|-----------|
| Base components (buttons, inputs, modals) | `components` Storybook | `api-reference`, `api-client` |
| Themes, CSS variables, design tokens | `api-reference` | `api-client`, `components` |
| Sidebar, search, OpenAPI rendering | `api-reference` | `api-client` |
| Request editor, response viewer, auth | `api-client` (web + app) | `api-reference` (modal via "Test Request") |
| Code highlighting, snippets | `api-reference` | `api-client` |
| Icons | `components` Storybook | `api-reference` |

### Artifact guidelines for PRs

When making UI changes, embed artifacts directly in the PR description. Cursor Cloud Agents can upload these automatically.

#### How it works

1. Save artifacts to `/opt/cursor/artifacts/` with descriptive snake_case names.
2. Reference artifacts in the PR description using HTML tags with absolute paths.
3. Use the PR management tooling to create or update the PR with those references.

```html
<!-- Screenshots -->
<img src="/opt/cursor/artifacts/screenshot_before.png" alt="Before change" />
<img src="/opt/cursor/artifacts/screenshot_after.png" alt="After change" />

<!-- Videos -->
<video src="/opt/cursor/artifacts/demo_feature.mp4" controls></video>
```

#### What to capture

- Include **before and after** screenshots for existing UI changes
- For new features, include screenshots in context
- Use the playground that best demonstrates the change
- If multiple playgrounds are affected, include artifacts from each
- For interactive changes, include a demo video

## OpenAPI Terminology

Use correct terminology when working with OpenAPI-related code:

- **OpenAPI** (not "Swagger") - The specification format
- **API description** (not "API spec" or "API definition") - The metadata document
- **Schema** - Data model describing request/response shapes
- **Dereference** - Replace all `$ref` with their values
- **Bundle** - Pull external `$ref`s into a single file
- **Resolve** - Look up the value at a `$ref` without modifying the document

## Further Reading

- [`CONTRIBUTING.md`](./CONTRIBUTING.md) - PR requirements, changesets, auto-generated files
- [`AGENT.md`](./AGENT.md) - Unified development guide, code conventions, and testing guidance
- [`.cursor/rules/cloud-agents-starter-skill.mdc`](./.cursor/rules/cloud-agents-starter-skill.mdc) - Runbook for CI parity and test servers
