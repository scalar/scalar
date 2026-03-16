---
name: cloud-agents-starter
description: Minimal starter runbook for cloud agents to install dependencies, run packages, execute tests, and troubleshoot the Scalar monorepo quickly.
---

# Cloud Agents Starter Skill - Scalar Codebase

Practical setup and execution instructions for running and testing this codebase. Use this as the first reference when starting the app, running tests, or debugging workflows.

## Prerequisites

- **Node.js**: v24 (see `.nvmrc`)
- **Package manager**: pnpm (v10.16.1+)
- **First-time setup**:
  ```bash
  pnpm install
  pnpm build:packages
  ```

---

## 1. Root / Monorepo

### Start development

There is no single root `pnpm dev`. Each package has its own dev script. To run a specific package:

```bash
pnpm --filter @scalar/api-client dev
pnpm --filter api-reference dev
pnpm --filter components dev
```

### Build

```bash
pnpm build:packages      # Build all packages (required before dev)
pnpm build:integrations # Build integrations
pnpm clean:build        # Clean, reinstall, and rebuild
```

### Lint & format

```bash
pnpm lint:check         # Check lint
pnpm lint:fix           # Auto-fix lint
pnpm format:check       # Check formatting
pnpm format             # Apply formatting
pnpm types:check        # TypeScript check
```

---

## 2. Packages (packages/*)

### Run a package dev server

```bash
cd packages/<package-name>
pnpm dev
```

Common entrypoints:

| Package | Dev command | Notes |
|---------|-------------|-------|
| `api-client` | `pnpm dev` | Runs playground:v2:web (Vite) |
| `api-reference` | `pnpm dev` | Main API reference playground |
| `components` | `pnpm dev` | Storybook on port 5100 |
| `mock-server` | `pnpm dev` | Mock server playground |
| `void-server` | `pnpm dev` | HTTP mirror server (port 5052) |
| `galaxy` | `pnpm dev` | Serves OpenAPI doc with @scalar/cli |

### Unit tests (Vitest)

```bash
pnpm test                           # Run all tests (packages + integrations)
pnpm vitest packages/*              # Packages only
pnpm vitest packages/api-client     # Single package
pnpm vitest packages/api-client --run  # Single run, no watch
pnpm test your-test-name            # Filter by test name
```

**Test servers required**: Some tests need `@scalar/void-server` (5052) and `proxy-scalar-com` (5051). Start them in a separate terminal:

```bash
pnpm script run test-servers
```

Then wait for ports: `pnpm script wait -p 5051 5052`

---

## 3. Integrations (integrations/*)

### Run integration dev servers

```bash
pnpm --filter @scalar/express-api-reference dev
pnpm --filter @scalar/fastify-api-reference dev
pnpm --filter @scalar/nuxt dev
pnpm --filter @scalar/nextjs-api-reference dev
```

### Integration tests

```bash
pnpm vitest integrations/*          # All integrations
pnpm vitest integrations/express   # Single integration
```

**Python integrations** (FastAPI, Django Ninja): Require Python 3.11. Run `python run_tests.py` in the integration directory.

**Rust/Java/.NET**: Have separate CI jobs; typically run via their native toolchains (cargo, mvn, dotnet).

---

## 4. E2E & Playwright

### API Reference E2E

```bash
cd packages/api-reference
pnpm test:e2e              # Local (needs Playwright browser)
pnpm test:e2e:ci          # CI mode
pnpm test:e2e:update-snapshots  # Update snapshots
```

### Components E2E (Storybook)

```bash
cd packages/components
pnpm test:e2e              # Local
pnpm test:e2e:ci           # CI mode
pnpm test:e2e:update       # Update snapshots
```

### Nuxt E2E

```bash
pnpm --filter @scalar/nuxt test:e2e
```

Playwright uses `PW_TEST_CONNECT_WS_ENDPOINT=ws://127.0.0.1:5001/` for browser connection in local runs.

---

## 5. Environment & Workflow

### Environment variables

- **CI**: Set `CI=1` for CI-like behavior (e.g. test servers, some Playwright runs).
- **NODE_OPTIONS**: `openapi-parser` tests use `NODE_OPTIONS=--max_old_space_size=8192` for large specs.
- **TEST_MODE=CDN**: Used for CDN snapshot tests in `api-reference`.

### Scripts (tooling/scripts)

```bash
pnpm script run test-servers   # Start void-server + proxy-scalar-com
pnpm script wait -p 5051 5052  # Wait for ports
pnpm script generate-readme    # Regenerate integration READMEs
```

### Feature flags

This codebase does not use feature flags. Configuration is via package options, OpenAPI spec extensions, or environment variables as noted above.

---

## 6. Projects & Examples

- **proxy-scalar-com** (Go): `cd projects/proxy-scalar-com && go run main.go` (port 5051)
- **Examples** (examples/*): Each has its own `pnpm dev` (e.g. `examples/web`, `examples/react`)

---

## 7. CI Parity (run like CI)

To approximate CI locally:

```bash
pnpm install
pnpm build:packages
pnpm script run test-servers & pnpm script wait -p 5051 5052
pnpm vitest packages/* --silent
pnpm vitest integrations/* --silent
pnpm types:check
pnpm lint:check
pnpm format:check
```

---

## 8. Updating This Skill

When you discover new testing tricks, runbook steps, or environment requirements:

1. **Add to the appropriate section** (root, packages, integrations, E2E, environment).
2. **Use concrete commands** – copy-pasteable, with package names and paths.
3. **Note edge cases** – e.g. "Python integrations need Python 3.11", "openapi-parser needs NODE_OPTIONS".
4. **Keep it minimal** – only include what agents need to run and test quickly.
5. **Cross-reference** – if a step depends on another (e.g. test-servers before package tests), state it clearly.

Preferred location for this skill: `.agents/skills/cloud-agents-starter/SKILL.md`.
