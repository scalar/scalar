# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scalar is a Vue 3 + TypeScript monorepo for API documentation and testing. It produces `@scalar/api-reference` (renders OpenAPI docs) and `@scalar/api-client` (API testing client), plus 40+ supporting packages and 18 framework integrations (Express, Fastify, Hono, NestJS, Next.js, Nuxt, etc.).

Uses pnpm workspaces, Turbo for build orchestration, Vite for Vue packages, esbuild for pure TS packages.

## Commands

```bash
pnpm install                    # Install dependencies
pnpm build:packages             # Build all packages (required before first dev)
pnpm clean:build                # Clean everything, reinstall, rebuild

# Development (per-package, not root-level)
pnpm --filter @scalar/api-reference dev
pnpm --filter @scalar/components dev    # Storybook on port 5100
pnpm --filter @scalar/api-client dev

# Testing
pnpm test                               # All tests (watch mode)
pnpm vitest packages/helpers --run       # Single package, single run
pnpm vitest packages/api-client          # Single package, watch mode
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

## Architecture

### Workspace Layout

- `packages/` — Core libraries (45 packages). Each is an npm package under `@scalar/`.
- `integrations/` — Framework-specific wrappers (Express, Fastify, Next.js, Nuxt, etc.)
- `projects/` — Deployable apps (`scalar-app`, `proxy-scalar-com`, `client-scalar-com`)
- `examples/` — Usage examples for various frameworks
- `tooling/` — Internal build scripts and changelog generator

### Build System

Two build strategies, both provided by `@scalar/build-tooling`:

1. **`scalar-build-esbuild`** — For pure TypeScript packages (helpers, types, openapi-parser, integrations). Fast, targets Node20+/ES2022, auto-discovers entry points, auto-generates `package.json#exports`.

2. **`scalar-build-vite`** — For Vue component packages (components, api-reference, api-client). Uses Vite + Rollup, extracts CSS, preserves modules.

Both externalize all dependencies (nothing is bundled into library output). `api-reference` is special: it has both a default build and a standalone build (`vite.standalone.config.ts`) that bundles everything for CDN usage.

Type checking uses `scalar-types-check` (pure TS) or `scalar-types-check-vue` (Vue packages with vue-tsc).

### Key Package Relationships

- `@scalar/core` — Shared rendering logic consumed by api-reference and integrations
- `@scalar/build-tooling` — Must build first; all other packages depend on its CLI tools
- `@scalar/themes` — CSS variables and design tokens used across all UI packages
- `@scalar/components` — Vue component library (with Storybook)
- `@scalar/oas-utils` — OpenAPI spec utilities shared across api-reference and api-client
- `@scalar/types` — Shared TypeScript types. Import from specific entry points (`@scalar/types/api-reference`, etc.), not the root.

### Dependency Versioning

All workspace packages use `workspace:*` for internal deps. Shared third-party versions are defined in `pnpm-workspace.yaml` under `catalogs:` and referenced as `catalog:*` in package.json files.

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
- Arrow functions preferred over function declarations
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
- Test files: `name.test.ts` alongside the source file
- Top-level `describe()` matches the file name
- Do not start test descriptions with "should": `it('generates a slug')` not `it('should generate a slug')`
- Minimize mocking; prefer pure functions
- Vue component tests: test behavior, not DOM structure or Tailwind classes

### Biome Lint Rules to Know

- `noBarrelFile: error` — No barrel files (except `index.ts` entry points)
- `noReExportAll: warn` — Avoid `export * from` (error in api-reference and openapi-parser)
- `noTsIgnore: error` — No `@ts-ignore` (use `@ts-expect-error` with explanation if needed)
- `useAwait: error` — Async functions must use `await`
- `noExportsInTest: error` — Do not export from test files
- `noFloatingPromises: warn` — Handle all promises

## Git Workflow

### Branch Naming

- `claude/feature-description` — New features
- `claude/fix-description` — Bug fixes
- `claude/chore-description` — Maintenance

### Commit Messages

- Conventional commits: `feat(api-client): add new endpoint`
- Present tense ("add" not "added")

## OpenAPI Terminology

Use correct terminology when working with OpenAPI-related code:

- **OpenAPI** (not "Swagger") — The specification format
- **API description** (not "API spec" or "API definition") — The metadata document
- **Schema** — Data model describing request/response shapes
- **Dereference** — Replace all `$ref` with their values
- **Bundle** — Pull external `$ref`s into a single file
- **Resolve** — Look up the value at a `$ref` without modifying the document

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ commands take precedence over `package.json` scripts. If there is a `test` script defined in `scripts` that conflicts with the built-in `vp test` command, run it using `vp run test`.
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
<!--VITE PLUS END-->
