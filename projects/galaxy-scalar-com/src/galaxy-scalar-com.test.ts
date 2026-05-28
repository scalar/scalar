import { Scalar } from '@scalar/hono-api-reference'
import { createMockServer } from '@scalar/mock-server'
import type { Context, Hono } from 'hono'
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
          cdn: '/scalar.js',
        }),
      )
    })

    it('mounts the reference UI and bundle routes', () => {
      configureApiReference(mockApp as Hono)

      expect(mockApp.get).toHaveBeenCalledWith('/', expect.any(Function))
      expect(mockApp.get).toHaveBeenCalledWith('/scalar.js', expect.any(Function))
    })
  })
})
