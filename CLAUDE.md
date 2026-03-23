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

Two build strategies using standard tools directly (no custom build CLI):

1. **`tsc` + `tsc-alias`** — For pure TypeScript packages (helpers, types, openapi-parser, integrations). Uses `tsconfig.build.json` per package.

2. **`vite build`** — For Vue component packages (components, api-reference, api-client). Uses Vite 8 + Rolldown, extracts CSS, preserves modules. Shared build helpers in `tooling/scripts/vite-lib-config.ts`.

Both externalize all dependencies (nothing is bundled into library output). `api-reference` is special: it has both a default build and a standalone build (`vite.standalone.config.ts`) that bundles everything for CDN usage.

Type checking uses `tsc --noEmit` (pure TS) or `vue-tsc --noEmit` (Vue packages).

### Key Package Relationships

- `@scalar/core` — Shared rendering logic consumed by api-reference and integrations
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
