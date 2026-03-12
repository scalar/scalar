# Agents

## Cursor Cloud specific instructions

### Overview

Scalar is a Vue 3 + TypeScript monorepo for API documentation and testing. It has two core products:
- **API Reference** (`@scalar/api-reference`) — renders interactive API docs from OpenAPI specs
- **API Client** (`@scalar/api-client`) — open-source API testing client

No databases or external services are required. The stack is entirely Node.js/pnpm.

### Prerequisites

- **Node.js v24** (per `.nvmrc`)
- **pnpm v10.16.1** (per `packageManager` in root `package.json`)

### Key commands

Standard commands are documented in `CLAUDE.md` and `CONTRIBUTING.md`. Quick reference:

| Task | Command |
|---|---|
| Install deps | `pnpm install` |
| Build packages | `pnpm build:packages` |
| Dev server (all) | `pnpm dev` |
| Dev single package | `pnpm --filter @scalar/api-reference dev` |
| Lint | `pnpm lint:check` |
| Tests | `pnpm test --run` |
| Format | `pnpm format` |
| Type check | `pnpm types:check` |

### Non-obvious caveats

- **Initial build required**: Turbo's `dev` task has `dependsOn: ["^build"]`, so you must run `pnpm build:packages` before any `dev` command will work. This only needs to happen once after a fresh install.
- **Fastify integration tests require integration build**: The `@scalar/fastify-api-reference` tests look for built JS files under `integrations/fastify/src/utils/js/standalone.js`. Run `pnpm build:integrations` if you need those tests to pass.
- **Some tests need test servers**: A few tests in `@scalar/oas-utils` and `@scalar/api-client` require `@scalar/void-server` running. Start them with `pnpm script run test-servers` (see `CONTRIBUTING.md`).
- **Full test suite takes ~10 minutes**: The monorepo has 800+ test files. For iterative development, prefer `pnpm test --run <pattern>` to filter.
- **Hot reload only works for the top-level package**: When running `pnpm dev` in one package, changes to its dependencies require rebuilding those deps with `pnpm build:packages`.
- **Port 5173**: The API Reference dev server defaults to port 5173. If occupied, Vite auto-selects the next available port.
- **Lefthook** handles pre-commit hooks (prettier + biome). It is installed via `pnpm install`.
