import { readFile } from 'node:fs/promises'
import { serve } from '@hono/node-server'
import { Scalar } from '@scalar/hono-api-reference'
import { createMockServer } from '@scalar/mock-server'
import type { Context } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { configureApiReference, createApp, loadDocument, main, startServer } from './galaxy-scalar-com'

// Mock all external dependencies
vi.mock('node:fs/promises')
vi.mock('@hono/node-server')
vi.mock('@scalar/hono-api-reference')
vi.mock('@scalar/mock-server')

// Mock environment variables
const originalEnv = process.env

describe('galaxy-scalar-com', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }

    // Reset mocks
    vi.mocked(readFile).mockReset()
    vi.mocked(serve).mockReset()
    vi.mocked(Scalar).mockReset()
    vi.mocked(createMockServer).mockReset()

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('loadDocument', () => {
    it('loads OpenAPI document successfully', async () => {
      const mockDocument = 'openapi: 3.1.0\ninfo:\n  title: Test API'
      vi.mocked(readFile).mockResolvedValue(mockDocument)

      const result = await loadDocument()

      expect(readFile).toHaveBeenCalledWith(expect.any(URL), 'utf8')
      expect(result).toBe(mockDocument)
    })

    it('handles missing OpenAPI document gracefully', async () => {
      vi.mocked(readFile).mockRejectedValue(new Error('File not found'))

      const result = await loadDocument()

      expect(console.error).toHaveBeenCalledWith(
        '[@scalar/mock-server] Missing @scalar/galaxy. Please build it and try again.',
      )
      expect(result).toBe('')
    })
  })

  describe('createApp', () => {
    it('creates mock server with correct configuration', async () => {
      const mockDocument = 'openapi: 3.1.0'
      vi.mocked(readFile).mockResolvedValue(mockDocument)

      const mockApp = {
        get: vi.fn(),
        fetch: vi.fn(),
      }
      vi.mocked(createMockServer).mockResolvedValue(mockApp as any)

      const app = await createApp()

      expect(createMockServer).toHaveBeenCalledWith({
        specification: mockDocument,
        onRequest: expect.any(Function),
      })
      expect(app).toBe(mockApp)
    })

    it('logs requests in onRequest callback', async () => {
      const mockDocument = 'openapi: 3.1.0'
      vi.mocked(readFile).mockResolvedValue(mockDocument)

      const mockApp = {
        get: vi.fn(),
        fetch: vi.fn(),
      }
      vi.mocked(createMockServer).mockResolvedValue(mockApp as any)

      await createApp()

      // Get the onRequest callback that was passed to createMockServer
      const createMockServerCall = vi.mocked(createMockServer).mock.calls[0]
      const onRequestCallback = createMockServerCall?.[0]?.onRequest

      // Mock context
      const mockContext = {
        req: {
          method: 'GET',
          url: 'http://localhost:5052/api/test',
        },
      } as Context

      // Call the callback
      onRequestCallback?.({
        context: mockContext,
        operation: {
          path: '/api/test',
          method: 'GET',
        },
      })

      expect(console.log).toHaveBeenCalledWith('GET http://localhost:5052/api/test')
    })
  })

  describe('configureApiReference', () => {
    it('configures Scalar with correct options', () => {
      const mockApp = {
        get: vi.fn(),
        fetch: vi.fn(),
      }

      configureApiReference(mockApp as any, 5052, false)

      expect(Scalar).toHaveBeenCalledWith({
        pageTitle: 'Scalar Galaxy',
        cdn: undefined,
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
        baseServerURL: 'http://localhost:5052',
      })
    })

    it('configures Scalar with local JS bundle when enabled', () => {
      const mockApp = {
        get: vi.fn(),
        fetch: vi.fn(),
      }

      configureApiReference(mockApp as any, 5052, true)

      expect(Scalar).toHaveBeenCalledWith(
        expect.objectContaining({
          cdn: '/scalar.js',
          baseServerURL: 'http://localhost:5052',
        }),
      )
    })

    it('adds scalar.js route when local JS bundle is enabled', () => {
      const mockApp = {
        get: vi.fn(),
        fetch: vi.fn(),
      }

      configureApiReference(mockApp as any, 5052, true)

      expect(mockApp.get).toHaveBeenCalledWith('/scalar.js', expect.any(Function))
    })

    it('does not add scalar.js route when local JS bundle is disabled', () => {
      const mockApp = {
        get: vi.fn(),
        fetch: vi.fn(),
      }

      configureApiReference(mockApp as any, 5052, false)

      expect(mockApp.get).not.toHaveBeenCalledWith('/scalar.js', expect.any(Function))
    })
  })

  describe('startServer', () => {
    it('starts server with correct configuration', () => {
      const mockApp = {
        get: vi.fn(),
        fetch: vi.fn(),
      }

      startServer(mockApp as any, 5052)

      expect(serve).toHaveBeenCalledWith(
        {
          fetch: mockApp.fetch,
          port: 5052,
          hostname: '0.0.0.0',
        },
        expect.any(Function),
      )
    })

    it('logs server startup message', () => {
      const mockApp = {
        get: vi.fn(),
        fetch: vi.fn(),
      }

      startServer(mockApp as any, 5052)

      // Get the callback passed to serve
      const serveCall = vi.mocked(serve).mock.calls[0]
      const callback = serveCall?.[1] as any

      // Call the callback with mock info
      callback({ port: 5052, address: '0.0.0.0', family: 'IPv4' })

      expect(console.log).toHaveBeenCalledWith()
      expect(console.log).toHaveBeenCalledWith('🚧 Mock Server listening on http://localhost:5052')
      expect(console.log).toHaveBeenCalledWith()
    })
  })

  describe('main', () => {
    it('uses default port when PORT is not set', async () => {
      delete process.env.PORT

      const mockDocument = 'openapi: 3.1.0'
      vi.mocked(readFile).mockResolvedValue(mockDocument)

      const mockApp = {
        get: vi.fn(),
        fetch: vi.fn(),
      }
      vi.mocked(createMockServer).mockResolvedValue(mockApp as any)

      await main()

      expect(serve).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 5052,
        }),
        expect.any(Function),
      )
    })

    it('uses custom port when PORT is set', async () => {
      process.env.PORT = '8080'

      const mockDocument = 'openapi: 3.1.0'
      vi.mocked(readFile).mockResolvedValue(mockDocument)

      const mockApp = {
        get: vi.fn(),
        fetch: vi.fn(),
      }
      vi.mocked(createMockServer).mockResolvedValue(mockApp as any)

      await main()

      expect(serve).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 8080,
        }),
        expect.any(Function),
      )
    })

    it('uses local JS bundle when LOCAL_JS_BUNDLE is true', async () => {
      process.env.LOCAL_JS_BUNDLE = 'true'

      const mockDocument = 'openapi: 3.1.0'
      vi.mocked(readFile).mockResolvedValue(mockDocument)

      const mockApp = {
        get: vi.fn(),
        fetch: vi.fn(),
      }
      vi.mocked(createMockServer).mockResolvedValue(mockApp as any)

      await main()

      expect(Scalar).toHaveBeenCalledWith(
        expect.objectContaining({
          cdn: '/scalar.js',
        }),
      )

      expect(mockApp.get).toHaveBeenCalledWith('/scalar.js', expect.any(Function))
    })

    it('does not use local JS bundle when LOCAL_JS_BUNDLE is not true', async () => {
      process.env.LOCAL_JS_BUNDLE = 'false'

      const mockDocument = 'openapi: 3.1.0'
      vi.mocked(readFile).mockResolvedValue(mockDocument)

      const mockApp = {
        get: vi.fn(),
        fetch: vi.fn(),
      }
      vi.mocked(createMockServer).mockResolvedValue(mockApp as any)

      await main()

      expect(Scalar).toHaveBeenCalledWith(
        expect.objectContaining({
          cdn: undefined,
        }),
      )

      expect(mockApp.get).not.toHaveBeenCalledWith('/scalar.js', expect.any(Function))
    })
  })
})
