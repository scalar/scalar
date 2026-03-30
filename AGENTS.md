# AGENTS.md – AI Agent Guide for Scalar

This file helps AI coding agents (Cursor, GitHub Copilot, etc.) work effectively in the Scalar codebase. For full development guidelines, see [CLAUDE.md](./CLAUDE.md).

## Project Overview

Scalar is a Vue 3 + TypeScript monorepo for API documentation and testing. It uses pnpm workspaces, Turbo for builds, and includes many packages and framework integrations.

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

## Key Commands

| Task | Command |
|------|---------|
| Build all packages | `pnpm build:packages` |
| Build integrations | `pnpm build:integrations` |
| Clean build | `pnpm clean:build` |
| Run unit tests | `pnpm test` |
| Run tests (single package) | `pnpm vitest packages/api-client --run` |
| Lint check | `pnpm lint:check` |
| Lint fix | `pnpm lint:fix` |
| Format | `pnpm format` |
| Type check | `pnpm types:check` |

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

## Directory Structure

```
packages/           # Core packages (@scalar/*)
integrations/       # Framework integrations (Express, FastAPI, etc.)
examples/           # Example apps
projects/           # Supporting projects (e.g. proxy-scalar-com)
```

## Code Conventions

- **Vue**: Composition API, `<script setup>`, TypeScript
- **Types**: Prefer `type` over `interface`
- **Files**: kebab-case (e.g. `api-client.ts`)
- **Components**: PascalCase (e.g. `ApiClient.vue`)
- **Tests**: `*.test.ts` alongside source, `describe('filename')`

## Testing

- **Unit tests**: Vitest, `*.test.ts` next to source
- **E2E**: Playwright in `packages/api-reference` and `packages/components`
- **Integration tests**: `pnpm vitest integrations/*`

## Git Workflow

- **Branch naming**: `claude/feature-description`, `claude/fix-description`
- **Commits**: Conventional commits, present tense, scope when relevant

## PR Requirements

### Semantic PR titles

PR titles must follow `type(scope): subject`:

```
fix(api-client): crashes when API returns null
^   ^            ^
|   |            subject
|   package scope
type (feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert)
```

### Changesets

If your PR will cause a version bump for any package, add a changeset:

```bash
pnpm changeset
```

## Visual Testing

When making changes that affect the UI, **PRs must include screenshots** (ideally before and after) demonstrating the visual impact. Most package dependencies trickle up into three main visual surfaces: `api-reference`, `api-client`, and `components`. Test your changes in whichever playground is relevant.

### Prerequisites

Build all packages before running any playground (dependencies must be compiled first):

```bash
pnpm install
pnpm build:packages
```

Alternatively, `pnpm turbo dev` or `pnpm turbo build` in a package directory will automatically build upstream dependencies via Turbo.

### Playgrounds

#### `packages/api-reference`

The API reference renderer. Changes to themes, layout, sidebar, code highlighting, and OpenAPI rendering are tested here.

```bash
cd packages/api-reference && pnpm dev
```

The default `dev` playground loads the Galaxy OpenAPI spec and renders the full reference UI.

Using Turbo (builds dependencies automatically):

```bash
pnpm turbo --filter @scalar/api-reference dev
```

See [`packages/api-reference/AGENTS.md`](./packages/api-reference/AGENTS.md) for package-specific instructions.

#### `packages/api-client`

The API testing client. Changes to request editors, response viewers, sidebar navigation, auth forms, and environment management are tested here.

The `v2` playgrounds are the current active version. Legacy (non-v2) playgrounds exist but are not the primary target.

| Playground | Command | Description |
|------------|---------|-------------|
| Web (default) | `cd packages/api-client && pnpm dev` | Web layout — standalone client in browser |
| Web | `cd packages/api-client && pnpm playground:v2:web` | Same as `dev` |
| App | `cd packages/api-client && pnpm playground:v2:app` | App layout — desktop-style with full sidebar and workspace features |
| Modal | `cd packages/api-client && pnpm playground:v2:modal` | Modal layout — opens as an overlay; also testable via the api-reference "Try it" button |

**Web vs App**: The **web** playground renders the client as a standalone browser page. The **app** playground renders the full desktop-style layout with workspace management, collections, and environments. Both should be checked when making broad client changes. The **modal** playground can also be tested through the api-reference playground by clicking "Test Request" on any operation.

Using Turbo:

```bash
pnpm turbo --filter @scalar/api-client dev
```

See [`packages/api-client/AGENTS.md`](./packages/api-client/AGENTS.md) for package-specific instructions.

#### `packages/components`

The shared component library, powered by Storybook. Changes to buttons, inputs, modals, dropdowns, icons, and other base components are tested here.

```bash
cd packages/components && pnpm dev      # Starts Storybook on port 5100
```

Using Turbo:

```bash
pnpm turbo --filter @scalar/components dev
```

Storybook runs on **http://localhost:5100** and renders all component stories. Use the sidebar to navigate to the component you changed.

See [`packages/components/AGENTS.md`](./packages/components/AGENTS.md) for package-specific instructions.

### Which playground to use

| Change area | Primary playground | Secondary |
|-------------|-------------------|-----------|
| Base components (buttons, inputs, modals) | `components` Storybook | `api-reference`, `api-client` |
| Themes, CSS variables, design tokens | `api-reference` | `api-client`, `components` |
| Sidebar, search, OpenAPI rendering | `api-reference` | — |
| Request editor, response viewer, auth | `api-client` (web + app) | `api-reference` (modal via "Test Request") |
| Code highlighting, snippets | `api-reference` | `api-client` |
| Icons | `components` Storybook | `api-reference` |

### Screenshot guidelines for PRs

- Include **before and after** screenshots when modifying existing UI.
- For new features, include screenshots showing the feature in context.
- Use the playground that best demonstrates the change.
- If the change affects multiple playgrounds, include screenshots from each.

## Further Reading

- [CONTRIBUTING.md](./CONTRIBUTING.md) – PR requirements, changesets, auto-generated files
- [CLAUDE.md](./CLAUDE.md) – Full development guide, Vue/TS conventions, testing
- [.cursor/rules/cloud-agents-starter-skill.mdc](./.cursor/rules/cloud-agents-starter-skill.mdc) – Runbook for CI parity and test servers
