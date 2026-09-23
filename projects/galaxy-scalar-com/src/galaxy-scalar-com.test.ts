import { Scalar } from '@scalar/hono-api-reference'
import { createMockServer } from '@scalar/mock-server'
import { type Context, Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { configureApiReference, createApp } from './galaxy-scalar-com'

// The OpenAPI document is mocked so the test stays isolated from the built
// @scalar/galaxy package.
vi.mock('@scalar/galaxy/3.1.json', () => ({ default: { openapi: '3.1.0' } }))
// Scalar() returns a Hono request handler; the factory keeps that shape so the
// route registered by configureApiReference is a function.
vi.mock('@scalar/hono-api-reference', () => ({ Scalar: vi.fn(() => vi.fn()) }))
vi.mock('@scalar/mock-server')

describe('galaxy-scalar-com', () => {
  const mockApp = {
    get: vi.fn(),
    fetch: vi.fn(),
  } as Partial<Hono>

  beforeEach(() => {
    vi.clearAllMocks()

    vi.spyOn(console, 'log').mockImplementation(vi.fn())

    return () => {
      vi.restoreAllMocks()
    }
  })

  describe('createApp', () => {
    it('creates the mock server with the bundled document', async () => {
      vi.mocked(createMockServer).mockResolvedValue(mockApp as Hono)

      const app = await createApp()

      expect(createMockServer).toHaveBeenCalledWith({
        document: { openapi: '3.1.0' },
        onRequest: expect.any(Function),
      })
      expect(app).toBe(mockApp)
    })

    it('logs requests in the onRequest callback', async () => {
      vi.mocked(createMockServer).mockResolvedValue(mockApp as Hono)

      await createApp()

      // Grab the onRequest callback that was handed to createMockServer.
      const onRequestCallback = vi.mocked(createMockServer).mock.calls[0]?.[0]?.onRequest

      const mockContext = {
        req: {
          method: 'GET',
          url: 'http://localhost/api/test',
        },
      } as Context

      onRequestCallback?.({
        context: mockContext,
        operation: {
          path: '/api/test',
          method: 'GET',
        },
      })

      expect(console.log).toHaveBeenCalledWith('GET http://localhost/api/test')
    })
  })

  describe('configureApiReference', () => {
    it('configures Scalar with the expected options', () => {
      configureApiReference(mockApp as Hono)

      expect(Scalar).toHaveBeenCalledWith(
        expect.objectContaining({
          pageTitle: 'Scalar Galaxy',
          sources: expect.arrayContaining([
            expect.objectContaining({
              title: expect.any(String),
              url: expect.any(String),
            }),
          ]),
          theme: expect.any(String),
          proxyUrl: 'https://proxy.scalar.com',
          persistAuth: true,
          agent: expect.objectContaining({
            key: expect.any(String),
          }),
          // Vitest builds run without the production `--define`, so the branch
          // bundle is served from the local route.
          bundle: '/scalar/standalone.esm.js',
        }),
      )
    })

    it('mounts the reference UI and bundle routes', () => {
      configureApiReference(mockApp as Hono)

      expect(mockApp.get).toHaveBeenCalledWith('/', expect.any(Function))
      expect(mockApp.get).toHaveBeenCalledWith('/scalar/*', expect.any(Function))
    })

    it('renders a module import for the branch-built ESM entry point', async () => {
      const { Scalar: renderScalar } =
        await vi.importActual<typeof import('@scalar/hono-api-reference')>('@scalar/hono-api-reference')
      vi.mocked(Scalar).mockImplementationOnce(renderScalar)
      const app = new Hono()
      configureApiReference(app)

      const response = await app.request('/')
      const html = await response.text()

      expect(response.status).toBe(200)
      expect(html).toContain('<script type="module">')
      expect(html).toContain("import { createApiReference } from '/scalar/standalone.esm.js'")
    })

    it('renders the published ESM build in production', async () => {
      vi.stubGlobal('GALAXY_IS_PRODUCTION', true)
      vi.resetModules()

      try {
        const { configureApiReference: configureProduction } = await import('./galaxy-scalar-com')
        const { Scalar: renderScalar } =
          await vi.importActual<typeof import('@scalar/hono-api-reference')>('@scalar/hono-api-reference')
        vi.mocked(Scalar).mockImplementationOnce(renderScalar)
        const app = new Hono()
        configureProduction(app)

        const response = await app.request('/')
        const html = await response.text()

        expect(response.status).toBe(200)
        expect(html).toContain('<script type="module">')
        expect(html).toContain(
          "import { createApiReference } from 'https://cdn.jsdelivr.net/npm/@scalar/api-reference/esm.js'",
        )
      } finally {
        vi.unstubAllGlobals()
        vi.resetModules()
      }
    })

    it.each(['/scalar/standalone.esm.js', '/scalar/chunks/vendor-example.js'])(
      'serves %s through the Pages assets binding',
      async (path) => {
        const app = new Hono()
        configureApiReference(app)
        const asset = new Response('export {}', { headers: { 'Content-Type': 'text/javascript' } })
        const fetch = vi.fn().mockResolvedValue(asset)
        const request = new Request(`https://galaxy.example${path}`)

        const response = await app.request(request, undefined, { ASSETS: { fetch } })

        expect(fetch).toHaveBeenCalledExactlyOnceWith(request)
        expect(response.status).toBe(200)
        expect(response.headers.get('Content-Type')).toBe('text/javascript')
        expect(await response.text()).toBe('export {}')
      },
    )

    it('includes the AsyncAPI document as a source', () => {
      configureApiReference(mockApp as Hono)

      const config = vi.mocked(Scalar).mock.calls[0]?.[0] as { sources?: Array<{ title?: string; content?: unknown }> }
      const asyncApiSource = config.sources?.find((source) => source.title === 'Scalar Galaxy Events (AsyncAPI)')

      expect(asyncApiSource?.content).toMatchObject({ asyncapi: expect.any(String) })
    })
  })
})
