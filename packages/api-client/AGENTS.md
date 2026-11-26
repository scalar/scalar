# AGENTS.md – `@scalar/api-client`

## Package Overview

`@scalar/api-client` provides request editors, response viewers, authentication forms, and shared client components. Its playground opens the embedded client modal. The full web and Electron desktop applications live in `projects/scalar-app`.

## Visual Testing

### Running the playgrounds

```bash
cd packages/api-client
pnpm dev --port 5065 --strictPort  # Modal playground
```

Or from the repo root with Turbo (auto-builds dependencies):

```bash
pnpm turbo --filter @scalar/api-client dev -- --port 5065 --strictPort
```

For the full application, build the workspace packages first and configure the environment required by `projects/scalar-app/assert-scalar-app-env.ts` (`VITE_ENV`, `VITE_API_URL`, `VITE_SERVICES_URL`, and `VITE_DASHBOARD_URL`). Then run from `projects/scalar-app`:

```bash
pnpm dev:web --port 5174 --strictPort  # Browser application
pnpm dev:app                         # Electron application
```

Follow the root guide's server reuse and cleanup rules. If a port is occupied by an unrelated process, choose another port without stopping that process. For Electron, set an explicit available `renderer.server.port` and `renderer.server.strictPort: true` in the local `projects/scalar-app/electron.vite.config.ts` before launch; do not commit task-specific port changes.

### Layout differences

| Layout | Script | Description |
|--------|--------|-------------|
| **Web** | `pnpm dev:web` in `projects/scalar-app` | Full browser client with sidebar, collections, environments, and workspace management. |
| **App** | `pnpm dev:app` in `projects/scalar-app` | Electron desktop application. Test desktop-specific behavior here. |
| **Modal** | `pnpm dev` in `packages/api-client` | Opens as an overlay. Also testable via the api-reference playground by clicking "Test Request" on any operation. |

### What to check

- **Address bar** — URL input, method selector, send button
- **Request editor** — body, headers, query params, path params, auth tabs
- **Response viewer** — status, headers, body with syntax highlighting
- **Sidebar** (app layout) — collection tree, request organization, drag-and-drop
- **Environments** (app layout) — variable management, environment switching
- **Auth** — various auth type forms (Bearer, Basic, API Key, OAuth)

### When to test each layout

- **Broad UI changes** (components, styling, layout) — test both **web** and **app**
- **Request/response changes** — **web** is sufficient
- **Sidebar, collections, workspace features** — test in **app**
- **Modal integration** — test via **api-reference** playground ("Test Request" button) or the `api-client` modal playground
