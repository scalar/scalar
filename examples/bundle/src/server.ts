import { type HtmlRenderingConfiguration, getHtmlDocument } from '@scalar/core/libs/html-rendering'
import { Hono } from 'hono'
import { logger } from 'hono/logger'

const DEFAULT_PORT = 3000
const DEFAULT_CONFIGURATION: Partial<HtmlRenderingConfiguration> = {
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  proxyUrl: 'https://proxy.scalar.com',
}

/**
 * Simple Hono server that serves an index.html file.
 * This server is designed to be lightweight and serve static content.
 */
const app = new Hono()

// Add logger middleware to log all requests
app.use(logger())

// Serve static files from the current directory
app.get('/', (c) => {
  // CDN URL from query parameter
  const cdn = c.req.query('SCALAR_CDN_URL') ?? 'https://cdn.jsdelivr.net/npm/@scalar/api-reference'
  // Configuration from query parameter
  const givenConfiguration = JSON.parse(c.req.query('SCALAR_CONFIGURATION') ?? '{}')

  // Configuration from query parameter or default configuration
  const configuration: Partial<HtmlRenderingConfiguration> =
    Object.keys(givenConfiguration).length > 0 ? givenConfiguration : DEFAULT_CONFIGURATION

  return c.html(
    getHtmlDocument({
      cdn,
      ...configuration,
    }),
  )
})

/**
 * Start the server on the specified port.
 * Defaults to port 3000 if PORT environment variable is not set.
 */
const port = Number.parseInt(process.env.PORT || DEFAULT_PORT.toString(), 10)

export default {
  port,
  fetch: app.fetch,
}
