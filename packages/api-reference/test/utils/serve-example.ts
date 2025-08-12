import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serve } from '@hono/node-server'
import { getHtmlDocument } from '@scalar/core/libs/html-rendering'
import type { HtmlRenderingConfiguration } from '@scalar/types/api-reference'
import { Hono } from 'hono'

/**
 * Default port to use for the server.
 *
 * @default 0 (random free port)
 */
const DEFAULT_PORT = process.env.PORT || 0

const DEFAULT_CONFIGURATION: Partial<HtmlRenderingConfiguration> = {
  cdn: '/scalar.js',
  url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
  proxyUrl: 'https://proxy.scalar.com',
}

/**
 * URL creation helper to pass a configuration and a local scalar.js URL
 *
 * @example
 * ```ts
 * const url = createExampleWithLocalBundle({ hiddenClients: ['fetch', 'axios'] })
 *
 * await page.goto(url)
 * ```
 */
export async function serveExample(givenConfiguration?: Partial<HtmlRenderingConfiguration>): Promise<string> {
  // Check if JS bundle exists
  const pathToJavaScriptBundle = getPathToJavaScriptBundle()

  if (!existsSync(pathToJavaScriptBundle)) {
    throw new Error(
      `JavaScript bundle not found at ${pathToJavaScriptBundle}. Please build @scalar/api-reference first.`,
    )
  }

  return new Promise((resolve) => {
    /**
     * Simple Hono server that serves an index.html file.
     * This server is designed to be lightweight and serve static content.
     */
    const app = new Hono()

    // Serve the JS bundle
    app.get('/scalar.js', (c) => c.text(readFileSync(pathToJavaScriptBundle, 'utf8')))

    // Serve static files from the current directory
    app.get('*', (c) => {
      // Configuration from query parameter or default configuration
      const configuration: Partial<HtmlRenderingConfiguration> =
        givenConfiguration && Object.keys(givenConfiguration ?? {}).length > 0
          ? {
              // Default configuration
              ...DEFAULT_CONFIGURATION,
              // If content is provided, we don't need to use the default URL
              ...{
                url: givenConfiguration.content || givenConfiguration.sources ? undefined : DEFAULT_CONFIGURATION.url,
              },
              // User configuration
              ...givenConfiguration,
            }
          : DEFAULT_CONFIGURATION

      return c.html(getHtmlDocument(configuration))
    })

    /**
     * Start the server on the specified port.
     * Defaults to port 3000 if PORT environment variable is not set.
     */
    const port = Number.parseInt(process.env.PORT || DEFAULT_PORT.toString(), 10)

    serve(
      {
        fetch: app.fetch,
        port,
      },
      ({ port }) => {
        resolve(`http://localhost:${port}`)
      },
    )
  })
}

/**
 * Looks into the package.json and returns the path to the browser bundle.
 */
function getPathToJavaScriptBundle() {
  const pathToPackageJson = join(new URL('.', import.meta.url).pathname, '../../package.json')
  const packageJson = readFileSync(pathToPackageJson, 'utf8')
  const { browser: bundlePath } = JSON.parse(packageJson)

  return join(new URL('.', import.meta.url).pathname, '../../', bundlePath)
}
