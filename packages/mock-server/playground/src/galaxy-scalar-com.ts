import { readFile } from 'node:fs/promises'

import { serve } from '@hono/node-server'
import { Scalar } from '@scalar/hono-api-reference'

import { createMockServer } from '@scalar/mock-server'
import type { Context } from 'hono'

/**
 * Read the OpenAPI document from the filesystem.
 *
 * We do not want to import from the package, to avoid a circular dependency as @scalar/galaxy uses @scalar/mock-server
 * for its playground.
 */
export async function loadDocument(): Promise<string> {
  return readFile(new URL('../../../galaxy/src/documents/3.1.yaml', import.meta.url), 'utf8').catch(() => {
    console.error('[@scalar/mock-server] Missing @scalar/galaxy. Please build it and try again.')
    return ''
  })
}

/**
 * Create and configure the mock server application.
 */
export async function createApp(): Promise<any> {
  const document = await loadDocument()

  return createMockServer({
    specification: document,
    onRequest: (opts: { context: Context }) => {
      console.log(`${opts.context.req.method} ${opts.context.req.url}`)
    },
  })
}

/**
 * Configure the API reference with Scalar.
 */
export function configureApiReference(app: any, port: number, useLocalJsBundle: boolean): void {
  app.get(
    '/',
    Scalar({
      pageTitle: 'Scalar Galaxy',
      cdn: useLocalJsBundle ? '/scalar.js' : undefined,
      sources: [
        {
          title: 'Scalar Galaxy',
          url: '/openapi.yaml',
        },
        {
          title: 'Petstore (OpenAPI 3.1)',
          url: 'https://petstore31.swagger.io/api/v31/openapi.json',
        },
        {
          title: 'Petstore (Swagger 2.0)',
          url: 'https://petstore.swagger.io/v2/swagger.json',
        },
      ],
      theme: 'default',
      proxyUrl: 'https://proxy.scalar.com',
      baseServerURL: `http://localhost:${port}`,
    }),
  )

  if (useLocalJsBundle) {
    app.get('/scalar.js', async (c: any) => c.text(await readFile(new URL('./scalar.js', import.meta.url), 'utf8')))
  }
}

/**
 * Start the server with the given configuration.
 */
export function startServer(app: any, port: number): void {
  serve(
    {
      fetch: app.fetch,
      port: Number(port),
      hostname: '0.0.0.0',
    },
    (info) => {
      console.log()
      console.log(`🚧 Mock Server listening on http://localhost:${info.port}`)
      console.log()
    },
  )
}

/**
 * Main function to initialize and start the mock server.
 */
export async function main(): Promise<void> {
  const port = process.env.PORT || 5052
  const useLocalJsBundle = process.env.LOCAL_JS_BUNDLE === 'true'

  const app = await createApp()
  configureApiReference(app, Number(port), useLocalJsBundle)
  startServer(app, Number(port))
}

// Start the server when this module is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
