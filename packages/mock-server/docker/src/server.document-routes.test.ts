import type { serve as Serve } from '@hono/node-server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { startMockServer } from './server'

// Only the network listener is replaced: the routes come from the real `createMockServer`, because
// the question here is which of two handlers registered for the same path actually answers.
vi.mock('@hono/node-server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@hono/node-server')>()),
  serve: vi.fn(),
}))

/** What the server hands to `serve`: the app's fetch handler and the WebSocket server to close afterwards. */
type ServeOptions = Omit<Parameters<typeof Serve>[0], 'fetch'> & {
  fetch: (request: Request) => Promise<Response>
  websocket: { server: { close: () => void } }
}

/** Start the Docker server and return the fetch handler it would have handed to the listener. */
const startApp = async (document: string, format: 'json' | 'yaml'): Promise<(path: string) => Promise<Response>> => {
  const { serve } = await import('@hono/node-server')
  vi.spyOn(console, 'log').mockImplementation(() => undefined)

  await startMockServer({ document, format })

  const options = vi.mocked(serve).mock.calls.at(-1)?.[0] as unknown as ServeOptions
  return async (path) => await options.fetch(new Request(`http://localhost${path}`))
}

describe('server.document-routes', () => {
  afterEach(async () => {
    const { serve } = await import('@hono/node-server')
    for (const [options] of vi.mocked(serve).mock.calls) {
      ;(options as unknown as ServeOptions).websocket.server.close()
    }
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  // `createOpenApiMockServer` registers `/openapi.json` and `/openapi.yaml` itself, before the Docker
  // server adds its own, and Hono answers with the first matching handler. Its handler re-serializes
  // the document, so anything only the raw text has (indentation, comments) tells the two apart.
  it('serves an OpenAPI JSON document from the library route, not the Docker one', async () => {
    const document = JSON.stringify({ openapi: '3.1.0', info: { title: 'Test', version: '1.0.0' }, paths: {} }, null, 2)
    const request = await startApp(document, 'json')

    const response = await request('/openapi.json')

    expect(response.status).toBe(200)
    const text = await response.text()
    expect(text).not.toBe(document)
    expect(JSON.parse(text)).toStrictEqual(JSON.parse(document))
  })

  it('serves an OpenAPI YAML document from the library route, not the Docker one', async () => {
    const document =
      'openapi: 3.1.0\ninfo:\n  title: Test\n  version: 1.0.0\npaths: {}\n# a comment only the raw text keeps\n'
    const request = await startApp(document, 'yaml')

    const response = await request('/openapi.yaml')

    expect(response.status).toBe(200)
    const text = await response.text()
    expect(text).not.toContain('# a comment only the raw text keeps')
    expect(text).toContain('title: Test')
  })

  // `createAsyncApiMockServer` only serves `/asyncapi.json` and `/asyncapi.yaml`, so for an AsyncAPI
  // document the Docker route is the one that answers — and the `/scalar` reference loads it from there.
  it('serves an AsyncAPI document from the Docker route', async () => {
    const document = JSON.stringify({ asyncapi: '3.1.0', info: { title: 'Events', version: '1.0.0' } }, null, 2)
    const request = await startApp(document, 'json')

    const response = await request('/openapi.json')

    expect(response.status).toBe(200)
    expect(await response.text()).toBe(document)
  })
})
