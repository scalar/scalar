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

### Ticket and issue linking

When a **Linear ticket** ID (e.g. `DOC-5102`, `ENG-123`) or a **GitHub issue** number/URL is provided in the prompt, instructions, or a related Slack thread, you **must** link it in the PR so that project-management integrations can track progress automatically.

If a GitHub issue number is available, include it explicitly in the PR description using `See #123` (non-closing) or `Fixes #123` (auto-closing on merge).

#### Linear tickets

Include the Linear issue ID in the **PR branch name** or **PR description** using a magic word. Linear's GitHub integration detects these and links the PR to the issue. Do **not** put the issue ID in the PR title — titles must follow the conventional commit format (e.g. `feat(api-reference): add my new feature`).

**Closing magic words** (move the issue to Done when the PR merges):
`close`, `closes`, `closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves`, `resolved`

**Non-closing magic words** (link without auto-closing):
`ref`, `refs`, `references`, `part of`, `related to`, `contributes to`, `toward`, `towards`

Examples (in the PR description):

```
Fixes DOC-5102
Part of ENG-123
Resolves DOC-5102, ENG-456
```

You can also use the full Linear URL: `Fixes https://linear.app/scalar/issue/DOC-5102/title`.

To link multiple issues, list them after the magic word separated by commas: `Fixes ENG-123, DES-5, ENG-256`.

#### GitHub issues

Use GitHub's closing keywords in the PR description to link and auto-close GitHub issues when the PR merges:

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

> **Tip:** Magic words must appear in the PR description (not in PR comments) for Linear to detect them. For GitHub issues, keywords work in both the PR description and commit messages.

### Changesets

For code changes in `packages/*` and `integrations/*`, a changeset is required. Use `patch` or `minor` version bumps based on impact; do not use `major`.

Before opening or updating a PR, run `pnpm changeset status` to verify changesets and catch missing or invalid changeset entries.

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
