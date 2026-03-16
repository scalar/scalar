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

| Task                       | Command                                 |
| -------------------------- | --------------------------------------- |
| Build all packages         | `pnpm build:packages`                   |
| Build integrations         | `pnpm build:integrations`               |
| Clean build                | `pnpm clean:build`                      |
| Run unit tests             | `pnpm test`                             |
| Run tests (single package) | `pnpm vitest packages/api-client --run` |
| Lint check                 | `pnpm lint:check`                       |
| Lint fix                   | `pnpm lint:fix`                         |
| Format                     | `pnpm format`                           |
| Type check                 | `pnpm types:check`                      |

## Development Servers

There is no single root `pnpm dev`. Run per package:

```bash
pnpm --filter @scalar/api-client dev
pnpm --filter api-reference dev
pnpm --filter components dev
```

| Package         | Purpose                        |
| --------------- | ------------------------------ |
| `api-client`    | API testing client playground  |
| `api-reference` | Main API reference playground  |
| `components`    | Storybook (port 5100)          |
| `void-server`   | HTTP mirror server (port 5052) |

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

## Further Reading

- [CONTRIBUTING.md](./CONTRIBUTING.md) – PR requirements, changesets, auto-generated files
- [CLAUDE.md](./CLAUDE.md) – Full development guide, Vue/TS conventions, testing
- [.cursor/rules/cloud-agents-starter-skill.mdc](./.cursor/rules/cloud-agents-starter-skill.mdc) – Runbook for CI parity and test servers

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
