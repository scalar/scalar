import type { FullConfig } from '@playwright/test'

export type WebServer = NonNullable<FullConfig['webServer']>

/** Default playwright version */
export const DEFAULT_PLAYWRIGHT_VERSION = '1.59.1'

/** Options for getting a docker server */
type GetDockerServerOptions = {
  version: string
  port: number
} & Partial<WebServer>

/** Default options for getting a docker server */
const DEFAULT_OPTS = {
  version: DEFAULT_PLAYWRIGHT_VERSION,
  port: 5001,
} as const satisfies GetDockerServerOptions

/**
 * Builds a Playwright {@link https://playwright.dev/docs/test-webserver | webServer} config
 * that starts the browser-side `playwright run-server` inside
 * {@link https://hub.docker.com/r/scalarapi/playwright-runner | `scalarapi/playwright-runner`}.
 *
 * **Important:** The `version` must stay aligned with the workspace `@playwright/test` major/minor
 * so the client and container speak the same protocol.
 */
export const getDockerServer = (opts: Partial<GetDockerServerOptions> = {}): WebServer => {
  const { version, port, ...rest } = { ...DEFAULT_OPTS, ...opts }
  return {
    name: 'Playwright',
    command: `docker run --name scalar-playwright --rm --platform linux/amd64 --entrypoint="playwright" --network=host scalarapi/playwright-runner:${version} run-server --port ${port} --host 0.0.0.0`,
    url: `http://localhost:${port}`,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    gracefulShutdown: {
      signal: 'SIGTERM',
      timeout: 10 * 1000,
    },
    // Apply any additional option overrides
    ...rest,
  }
}
