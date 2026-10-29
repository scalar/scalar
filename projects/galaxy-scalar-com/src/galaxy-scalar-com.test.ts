import { Scalar } from '@scalar/hono-api-reference'
import { createMockServer } from '@scalar/mock-server'
import { type Context, Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { asyncApiDocument } from './asyncapi-document'
import { configureApiReference, createApp } from './galaxy-scalar-com'
import { upgradeWebSocket } from './upgrade-websocket'

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
    vi.mocked(createMockServer).mockResolvedValue(new Hono())

    vi.spyOn(console, 'log').mockImplementation(vi.fn())

    return () => {
      vi.restoreAllMocks()
    }
  })

  describe('createApp', () => {
    it('creates the mock server with the bundled document', async () => {
      vi.mocked(createMockServer).mockResolvedValue(new Hono())

      await createApp()

      expect(createMockServer).toHaveBeenCalledWith({
        document: { openapi: '3.1.0' },
        onRequest: expect.any(Function),
      })
      expect(createMockServer).toHaveBeenCalledWith({ document: asyncApiDocument, upgradeWebSocket })
    })

    it('logs requests in the onRequest callback', async () => {
      vi.mocked(createMockServer).mockResolvedValue(new Hono())

      await createApp()

      // Grab the onRequest callback that was handed to createMockServer.
      const onRequestCallback = vi.mocked(createMockServer).mock.calls[1]?.[0]?.onRequest

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
    /**
     * The route hands Scalar a resolver so the configuration is built per request. Call it with a
     * request-shaped context to read the configuration a visitor would get.
     */
    const resolveConfiguration = (request = new Request('https://galaxy.example/')): Record<string, unknown> => {
      const resolver = vi.mocked(Scalar).mock.calls[0]?.[0]
      if (typeof resolver !== 'function') {
        throw new Error('Expected Scalar to receive a configuration resolver')
      }
      return resolver({ req: { raw: request } } as Context) as Record<string, unknown>
    }

    /** Build a request that carries the time zone Cloudflare geolocated for the visitor. */
    const requestFrom = (timeZone: string): Request =>
      Object.assign(new Request('https://galaxy.example/'), { cf: { timezone: timeZone } })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('configures Scalar with the expected options', () => {
      configureApiReference(mockApp as Hono)

      expect(resolveConfiguration()).toEqual(
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

    it('renders the local document and branch-built ESM entry point', async () => {
      const { Scalar: renderScalar } =
        await vi.importActual<typeof import('@scalar/hono-api-reference')>('@scalar/hono-api-reference')
      vi.mocked(Scalar).mockImplementationOnce(renderScalar)
      const app = new Hono()
      configureApiReference(app)

      const response = await app.request('/')
      const html = await response.text()

      expect(html).toContain('/openapi.yaml')
      expect(response.status).toBe(200)
      expect(html).toContain('<script type="module">')
      expect(html).toContain("import { createApiReference } from '/scalar/standalone.esm.js'")
    })

    it('renders the registry document and published ESM build in production', async () => {
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

        expect(html).toContain('https://registry.scalar.com/@scalar/apis/galaxy?format=json')
        expect(html).not.toContain('/openapi.yaml')
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

    it.each([
      ['2026-10-01T00:00:00Z', 'halloween'],
      ['2026-10-31T23:59:59Z', 'halloween'],
      ['2026-09-30T23:59:59Z', 'default'],
      ['2026-11-01T00:00:00Z', 'default'],
    ])('picks the theme for the current date (%s uses %s)', (isoDate, theme) => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date(isoDate))
      configureApiReference(mockApp as Hono)

      expect(resolveConfiguration().theme).toBe(theme)
    })

    it('picks the theme in the visitor time zone', () => {
      // 03:00 UTC on November 1 is still Halloween evening in New York.
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-11-01T03:00:00Z'))
      configureApiReference(mockApp as Hono)

      expect(resolveConfiguration().theme).toBe('default')
      expect(resolveConfiguration(requestFrom('America/New_York')).theme).toBe('halloween')
    })

    it('renders the seasonal theme into the page', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      const { Scalar: renderScalar } =
        await vi.importActual<typeof import('@scalar/hono-api-reference')>('@scalar/hono-api-reference')
      vi.mocked(Scalar).mockImplementationOnce(renderScalar)
      const app = new Hono()
      configureApiReference(app)

      // The same route flips theme as the date changes, so a long-lived worker stays current.
      vi.setSystemTime(new Date('2026-10-15T12:00:00Z'))
      const duringHalloween = await (await app.request('/')).text()
      vi.setSystemTime(new Date('2026-11-15T12:00:00Z'))
      const afterHalloween = await (await app.request('/')).text()

      expect(duringHalloween).toContain('"theme": "halloween"')
      expect(afterHalloween).toContain('"theme": "default"')
      expect(afterHalloween).not.toContain('"theme": "halloween"')
    })

    it('includes the AsyncAPI document as a source', () => {
      configureApiReference(mockApp as Hono)

      const config = resolveConfiguration() as { sources?: Array<{ title?: string; url?: string }> }
      const asyncApiSource = config.sources?.find((source) => source.title === 'Scalar Galaxy Events (AsyncAPI)')

      expect(asyncApiSource?.url).toBe('/asyncapi.json')
    })
  })
})
