# Playwright helpers (`@scalar/helpers/playwright`)

Shared Playwright utilities for Scalar packages. Today this folder is mainly the Docker-backed **test server** helper used so local E2E runs use the same browser environment as CI.

## `getDockerServer` (`./docker`)

Returns a Playwright [`webServer`](https://playwright.dev/docs/test-webserver) object that runs:

```text
docker run … scalarapi/playwright-runner:<version> run-server --port <port> --host 0.0.0.0
```

- **Image:** `scalarapi/playwright-runner` (Playwright’s published runner image), tagged with the same Playwright version the repo pins in `DEFAULT_PLAYWRIGHT_VERSION` in `docker.ts`. Keep that tag in sync with the workspace `@playwright/test` version.
- **Platform:** `linux/amd64` so Apple Silicon machines still exercise the same stack CI uses on `amd64`.
- **Why use it:** Browsers inside the container match Linux CI for fonts, rendering, and snapshot stability better than a native macOS/Windows install alone.

### Docker and `--network=host`

The command uses `--network=host` so the browser in the container can reach services listening on the host (Storybook, Vite, etc.). **Docker Desktop on macOS and Windows often does not support host networking.** Use a Docker implementation that does (for example [OrbStack](https://orbstack.dev/)), or rely on CI/Linux for authoritative snapshot runs.

If pulls appear to succeed but the image is missing or stale, pull explicitly:

```bash
docker pull scalarapi/playwright-runner:<version>
```

Replace `<version>` with the value of `DEFAULT_PLAYWRIGHT_VERSION` in `docker.ts` (or the `version` you pass into `getDockerServer`).

### Overrides

`getDockerServer({ ... })` merges any extra `webServer` fields (for example `reuseExistingServer: !CI`) onto the returned object.
