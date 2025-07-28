import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serve } from '@hono/node-server'
import { getHtmlDocument } from '@scalar/core/libs/html-rendering'
import type { HtmlRenderingConfiguration } from '@scalar/types/api-reference'
import { Hono } from 'hono'

const DEFAULT_PORT = process.env.PORT || 0

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
  return new Promise((resolve) => {
    const DEFAULT_CONFIGURATION: Partial<HtmlRenderingConfiguration> = {
      cdn: '/scalar.js',
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
      proxyUrl: 'https://proxy.scalar.com',
    }

    /**
     * Simple Hono server that serves an index.html file.
     * This server is designed to be lightweight and serve static content.
     */
    const app = new Hono()

    // Serve static files from the current directory
    app.get('/', (c) => {
      // Configuration from query parameter or default configuration
      const configuration: Partial<HtmlRenderingConfiguration> =
        givenConfiguration && Object.keys(givenConfiguration ?? {}).length > 0
          ? { ...DEFAULT_CONFIGURATION, ...givenConfiguration }
          : DEFAULT_CONFIGURATION

      return c.html(getHtmlDocument(configuration))
    })

    app.get('/scalar.js', (c) =>
      c.text(readFileSync(join(new URL('.', import.meta.url).pathname, '../../src/scalar.js'), 'utf8')),
    )

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
