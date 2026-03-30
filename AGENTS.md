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

When making changes that affect the UI, **PRs must include visual artifacts** (screenshots and/or demo videos) demonstrating the visual impact. Most package dependencies trickle up into three main visual surfaces: `api-reference`, `api-client`, and `components`. Test your changes in whichever playground is relevant.

### Prerequisites

Build all packages before running any playground (dependencies must be compiled first):

```bash
pnpm install
pnpm build:packages
```

Alternatively, `pnpm turbo dev` or `pnpm turbo build` in a package directory will automatically build upstream dependencies via Turbo.

### Playgrounds

Each playground can be started with `pnpm dev` inside its package directory, or from the repo root using Turbo (which auto-builds dependencies):

| Package | Quick start | Turbo | Details |
|---------|------------|-------|---------|
| `api-reference` | `cd packages/api-reference && pnpm dev` | `pnpm turbo --filter @scalar/api-reference dev` | [`AGENTS.md`](./packages/api-reference/AGENTS.md) |
| `api-client` | `cd packages/api-client && pnpm dev` | `pnpm turbo --filter @scalar/api-client dev` | [`AGENTS.md`](./packages/api-client/AGENTS.md) |
| `components` | `cd packages/components && pnpm dev` | `pnpm turbo --filter @scalar/components dev` | [`AGENTS.md`](./packages/components/AGENTS.md) |

The `api-client` has multiple layouts (web, app, modal) — see its package `AGENTS.md` for details.

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

When making UI changes, **PRs must include visual artifacts** (screenshots and videos) embedded directly in the PR description. Cursor Cloud Agents can post these artifacts to GitHub automatically.

#### How it works

1. **Save artifacts** to `/opt/cursor/artifacts/` with descriptive snake_case names (e.g. `screenshot_sidebar_before.png`, `demo_dark_mode_toggle.mp4`).
2. **Reference artifacts in the PR description** using HTML tags with absolute file paths. The platform automatically uploads them and rewrites the paths to public URLs.

```html
<!-- Screenshots -->
<img src="/opt/cursor/artifacts/screenshot_before.png" alt="Before change" />
<img src="/opt/cursor/artifacts/screenshot_after.png" alt="After change" />

<!-- Videos -->
<video src="/opt/cursor/artifacts/demo_feature.mp4" controls></video>
```

3. **Use the `ManagePullRequest` tool** to create or update the PR with these references in the body.

#### What to capture

- Include **before and after** screenshots when modifying existing UI.
- For new features, include screenshots showing the feature in context.
- Use the playground that best demonstrates the change.
- If the change affects multiple playgrounds, include screenshots from each.
- For interactive changes (animations, state transitions, flows), record a **demo video** showing the feature working end-to-end.

#### PR description format

Add a `## Visual` section to the PR description with the artifacts:

```markdown
## Visual

<img src="/opt/cursor/artifacts/screenshot_before.png" alt="Before" />
<img src="/opt/cursor/artifacts/screenshot_after.png" alt="After" />
<video src="/opt/cursor/artifacts/demo_feature.mp4" controls></video>
```

## Further Reading

- [CONTRIBUTING.md](./CONTRIBUTING.md) – PR requirements, changesets, auto-generated files
- [CLAUDE.md](./CLAUDE.md) – Full development guide, Vue/TS conventions, testing
- [.cursor/rules/cloud-agents-starter-skill.mdc](./.cursor/rules/cloud-agents-starter-skill.mdc) – Runbook for CI parity and test servers
