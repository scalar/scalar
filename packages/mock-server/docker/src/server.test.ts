import type { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { startMockServer } from './server'

// Mock @hono/node-server
vi.mock('@hono/node-server', () => ({
  serve: vi.fn(),
}))

// Mock @scalar/mock-server
vi.mock('@scalar/mock-server', () => ({
  createMockServer: vi.fn(),
}))

// Mock @scalar/hono-api-reference
vi.mock('@scalar/hono-api-reference', () => ({
  Scalar: vi.fn(),
}))

describe('startMockServer', () => {
  let mockApp: {
    get: ReturnType<typeof vi.fn>
    fetch: ReturnType<typeof vi.fn>
  }
  let mockServe: ReturnType<typeof vi.fn>
  let mockCreateMockServer: ReturnType<typeof vi.fn>
  let mockScalar: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    // Import mocked modules
    const { serve } = await import('@hono/node-server')
    const { createMockServer } = await import('@scalar/mock-server')
    const { Scalar } = await import('@scalar/hono-api-reference')

    mockServe = vi.mocked(serve)
    mockCreateMockServer = vi.mocked(createMockServer)
    mockScalar = vi.mocked(Scalar)

    mockApp = {
      get: vi.fn(),
      fetch: vi.fn(),
    }

    mockCreateMockServer.mockResolvedValue(mockApp as unknown as Hono)
    mockScalar.mockReturnValue(() => undefined)
    mockServe.mockImplementation((config, callback) => {
      if (callback) {
        callback({ address: '0.0.0.0', port: config.port || 3000 })
      }
    })
  })

  it('should start server with default port 3000', async () => {
    const document = '{"openapi":"3.0.0","info":{"title":"Test"}}'

    await startMockServer({
      document,
      format: 'json',
    })

    expect(mockCreateMockServer).toHaveBeenCalledWith({
      document,
      onRequest: expect.any(Function),
    })
    expect(mockServe).toHaveBeenCalledWith(
      {
        fetch: mockApp.fetch,
        port: 3000,
      },
      expect.any(Function),
    )
  })

  it('should start server with custom port', async () => {
    const document = '{"openapi":"3.0.0","info":{"title":"Test"}}'

    await startMockServer({
      document,
      format: 'json',
      port: 8080,
    })

    expect(mockServe).toHaveBeenCalledWith(
      {
        fetch: mockApp.fetch,
        port: 8080,
      },
      expect.any(Function),
    )
  })

  it('should create /openapi.json endpoint for JSON format', async () => {
    const document = '{"openapi":"3.0.0","info":{"title":"Test"}}'

    await startMockServer({
      document,
      format: 'json',
    })

    expect(mockApp.get).toHaveBeenCalledWith('/openapi.json', expect.any(Function))
  })

  it('should create /openapi.yaml endpoint for YAML format', async () => {
    const document = 'openapi: 3.0.0\ninfo:\n  title: Test'

    await startMockServer({
      document,
      format: 'yaml',
    })

    expect(mockApp.get).toHaveBeenCalledWith('/openapi.yaml', expect.any(Function))
  })

  it('should set correct Content-Type header for JSON endpoint', async () => {
    const document = '{"openapi":"3.0.0","info":{"title":"Test"}}'
    const mockContext = {
      header: vi.fn(),
      text: vi.fn((text) => text),
    }

    await startMockServer({
      document,
      format: 'json',
    })

    const handler = mockApp.get.mock.calls.find((call) => call[0] === '/openapi.json')?.[1]
    expect(handler).toBeDefined()

    if (handler) {
      handler(mockContext)
      expect(mockContext.header).toHaveBeenCalledWith('Content-Type', 'application/json')
      expect(mockContext.text).toHaveBeenCalledWith(document)
    }
  })

  it('should set correct Content-Type header for YAML endpoint', async () => {
    const document = 'openapi: 3.0.0\ninfo:\n  title: Test'
    const mockContext = {
      header: vi.fn(),
      text: vi.fn((text) => text),
    }

    await startMockServer({
      document,
      format: 'yaml',
    })

    const handler = mockApp.get.mock.calls.find((call) => call[0] === '/openapi.yaml')?.[1]
    expect(handler).toBeDefined()

    if (handler) {
      handler(mockContext)
      expect(mockContext.header).toHaveBeenCalledWith('Content-Type', 'application/yaml; charset=UTF-8')
      expect(mockContext.text).toHaveBeenCalledWith(document)
    }
  })

  it('should create /scalar endpoint for API Reference', async () => {
    const document = '{"openapi":"3.0.0","info":{"title":"Test"}}'

    await startMockServer({
      document,
      format: 'json',
    })

    expect(mockApp.get).toHaveBeenCalledWith('/scalar', expect.any(Function))
    expect(mockScalar).toHaveBeenCalledWith({
      url: '/openapi.json',
      theme: 'default',
    })
  })

  it('should use /openapi.yaml URL for Scalar when format is YAML', async () => {
    const document = 'openapi: 3.0.0\ninfo:\n  title: Test'

    await startMockServer({
      document,
      format: 'yaml',
    })

    expect(mockScalar).toHaveBeenCalledWith({
      url: '/openapi.yaml',
      theme: 'default',
    })
  })

  it('should register onRequest callback with createMockServer', async () => {
    const document = '{"openapi":"3.0.0","info":{"title":"Test"}}'

    await startMockServer({
      document,
      format: 'json',
    })

    expect(mockCreateMockServer).toHaveBeenCalledWith({
      document,
      onRequest: expect.any(Function),
    })

    // Test that onRequest callback logs requests
    const onRequest = mockCreateMockServer.mock.calls[0]?.[0]?.onRequest
    expect(onRequest).toBeDefined()
    if (!onRequest) {
      throw new Error('onRequest callback not found')
    }
    const mockContext = {
      req: {
        method: 'GET',
        path: '/test',
      },
    }

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    onRequest({ context: mockContext })
    expect(consoleSpy).toHaveBeenCalledWith('GET', '/test')
    consoleSpy.mockRestore()
  })

  it('should log server information when started', async () => {
    const document = '{"openapi":"3.0.0","info":{"title":"Test"}}'
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await startMockServer({
      document,
      format: 'json',
      port: 3000,
    })

    expect(consoleSpy).toHaveBeenCalledWith()
    expect(consoleSpy).toHaveBeenCalledWith('Starting mock server...')
    expect(consoleSpy).toHaveBeenCalledWith()

    // Check that serve callback logs the server info
    const serveCallback = mockServe.mock.calls[0]?.[1]
    expect(serveCallback).toBeDefined()
    if (serveCallback) {
      serveCallback({ address: '0.0.0.0', port: 3000 })
    }

    expect(consoleSpy).toHaveBeenCalledWith('🚀 Mock Server listening on http://0.0.0.0:3000')
    expect(consoleSpy).toHaveBeenCalledWith('📖 API Reference: http://0.0.0.0:3000/scalar')

    consoleSpy.mockRestore()
  })
})
