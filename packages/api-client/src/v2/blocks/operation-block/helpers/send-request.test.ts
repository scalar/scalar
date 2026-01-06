import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ClientPlugin } from '@/v2/helpers/plugins'

import { sendRequest } from './send-request'

const MOCK_URL = 'https://api.example.com'

const globalFetchSpy = vi.spyOn(global, 'fetch')
afterEach(() => {
  globalFetchSpy.mockReset()
})

describe('sendRequest', () => {
  const createMockOperation = (overrides: Partial<OperationObject> = {}): OperationObject =>
    ({
      operationId: 'test-operation',
      summary: 'Test operation',
      description: 'Test operation description',
      tags: [],
      parameters: [],
      responses: {},
      ...overrides,
    }) as OperationObject

  /**
   * Adds a URL property to a Response object and ensures it persists through cloning.
   * This is needed because Response objects created in tests don't have a URL by default.
   */
  const addUrlToResponse = (response: Response, url: string): Response => {
    Object.defineProperty(response, 'url', {
      value: url,
      writable: false,
    })

    // Override clone method to preserve the URL
    const originalClone = response.clone.bind(response)
    response.clone = () => {
      const cloned = originalClone()
      Object.defineProperty(cloned, 'url', {
        value: url,
        writable: false,
      })
      return cloned
    }

    return response
  }

  /**
   * Creates a mock Response that mimics what an echo server would return.
   * This allows us to test without needing a running server.
   */
  const createMockEchoResponse = (request: Request, overrides: Partial<ResponseInit> = {}) => {
    const url = new URL(request.url)
    const query: Record<string, string | string[]> = {}

    url.searchParams.forEach((value, key) => {
      if (query[key]) {
        query[key] = Array.isArray(query[key]) ? [...(query[key] as string[]), value] : [query[key] as string, value]
      } else {
        query[key] = value
      }
    })

    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    const echoData = {
      method: request.method,
      path: url.pathname + url.search,
      query,
      headers,
      body: '',
    }

    const response = new Response(JSON.stringify(echoData), {
      status: 200,
      statusText: 'OK',
      headers: new Headers({
        'content-type': 'application/json',
      }),
      ...overrides,
    })

    return addUrlToResponse(response, request.url)
  }

  it('sends a basic request and returns response data', async () => {
    const request = new Request(MOCK_URL)
    const operation = createMockOperation()

    globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(request))

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      operation,
      request,
      plugins: [],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.data).toBeDefined()
    expect(result.response.status).toBe(200)
    expect(result.response.headers).toBeDefined()
    expect(result.response.duration).toBeGreaterThanOrEqual(0)
    expect(result.response.method).toBe('GET')
    expect(result.response.path).toBe('/')
    expect(result.timestamp).toBeGreaterThan(0)
  })

  it('handles POST requests', async () => {
    const request = new Request(MOCK_URL, {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
    })
    const operation = createMockOperation()

    const mockResponse = addUrlToResponse(
      new Response(
        JSON.stringify({
          method: 'POST',
          path: '/',
          body: { test: 'data' },
        }),
        {
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
        },
      ),
      request.url,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      operation,
      request,
      plugins: [],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.method).toBe('POST')
    expect(JSON.parse(result.response.data as string)).toMatchObject({
      method: 'POST',
      body: { test: 'data' },
    })
  })

  it('handles requests with query parameters', async () => {
    const url = new URL(MOCK_URL)
    url.searchParams.set('foo', 'bar')
    url.searchParams.set('test', 'value')

    const request = new Request(url.toString())
    const operation = createMockOperation()

    globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(request))

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      operation,
      request,
      plugins: [],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.path).toBe('/?foo=bar&test=value')
    expect(JSON.parse(result.response.data as string).query).toMatchObject({
      foo: 'bar',
      test: 'value',
    })
  })

  it('handles requests with custom headers', async () => {
    const request = new Request(MOCK_URL, {
      headers: {
        'X-Custom-Header': 'custom-value',
        'Content-Type': 'application/json',
      },
    })
    const operation = createMockOperation()

    globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(request))

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      operation,
      request,
      plugins: [],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    const responseData = JSON.parse(result.response.data as string)
    expect(responseData.headers['x-custom-header']).toBe('custom-value')
    expect(responseData.headers['content-type']).toBe('application/json')
  })

  it('normalizes response headers', async () => {
    const request = new Request(MOCK_URL)
    const mockResponse = addUrlToResponse(
      new Response('test', {
        status: 200,
        headers: new Headers({
          'content-type': 'text/plain',
          'x-custom-header': 'value',
        }),
      }),
      request.url,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const operation = createMockOperation()

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      operation,
      request,
      plugins: [],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.headers).toHaveProperty('Content-Type')
    expect(result.response.headers).toHaveProperty('X-Custom-Header')
  })

  it('handles 204 No Content responses', async () => {
    const request = new Request(`${MOCK_URL}/204`)
    const operation = createMockOperation()

    const mockResponse = addUrlToResponse(
      new Response(null, {
        status: 204,
        statusText: 'No Content',
      }),
      request.url,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      operation,
      request,
      plugins: [],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.status).toBe(204)
    expect(result.response.data).toBe('')
  })

  it('handles 205 Reset Content responses', async () => {
    const request = new Request(MOCK_URL)
    const mockResponse = addUrlToResponse(
      new Response(null, {
        status: 205,
        statusText: 'Reset Content',
      }),
      request.url,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const operation = createMockOperation()

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      operation,
      request,
      plugins: [],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.status).toBe(205)
  })

  it('handles 304 Not Modified responses', async () => {
    const request = new Request(MOCK_URL)
    const mockResponse = addUrlToResponse(
      new Response(null, {
        status: 304,
        statusText: 'Not Modified',
      }),
      request.url,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const operation = createMockOperation()

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      operation,
      request,
      plugins: [],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.status).toBe(304)
  })

  it('handles responses with status codes', async () => {
    const request = new Request(MOCK_URL)
    const mockResponse = addUrlToResponse(
      new Response('OK', {
        status: 200,
        statusText: 'OK',
      }),
      request.url,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const operation = createMockOperation()

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      operation,
      request,
      plugins: [],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.status).toBe(200)
  })

  it('handles error status codes', async () => {
    const request = new Request(MOCK_URL)
    const mockResponse = addUrlToResponse(
      new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      }),
      request.url,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const operation = createMockOperation()

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      operation,
      request,
      plugins: [],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.status).toBe(404)
  })

  it('handles empty response body', async () => {
    const mockEmptyStream = new ReadableStream({
      start(controller) {
        controller.close()
      },
    })

    const mockResponse = {
      status: 204,
      headers: new Headers(),
      body: mockEmptyStream,
      ok: true,
      statusText: 'No Content',
      url: MOCK_URL,
      clone: () => mockResponse,
      text: async () => '',
      json: async () => ({}),
      arrayBuffer: async () => new ArrayBuffer(0),
    } as Partial<Response>

    globalFetchSpy.mockResolvedValueOnce(mockResponse as Response)

    const request = new Request(MOCK_URL)
    const operation = createMockOperation()

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      operation,
      request,
      plugins: [],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.data).toBe('')
  })

  it('calculates response duration', async () => {
    const request = new Request(MOCK_URL)
    const operation = createMockOperation()

    globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(request))

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      operation,
      request,
      plugins: [],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.duration).toBeGreaterThanOrEqual(0)
    expect(typeof result.response.duration).toBe('number')
  })

  it('includes response size in bytes', async () => {
    const request = new Request(MOCK_URL)
    const operation = createMockOperation()

    globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(request))

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      operation,
      request,
      plugins: [],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.size).toBeGreaterThan(0)
    expect(typeof result.response.size).toBe('number')
  })

  it('extracts cookie headers when available', async () => {
    const request = new Request(MOCK_URL)
    const mockResponse = addUrlToResponse(
      new Response('test', {
        status: 200,
        headers: new Headers({
          'set-cookie': 'sessionId=abc123; Path=/; HttpOnly',
        }),
      }),
      request.url,
    )

    // Mock getSetCookie method
    Object.defineProperty(mockResponse.headers, 'getSetCookie', {
      value: () => ['sessionId=abc123; Path=/; HttpOnly'],
      writable: true,
    })

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const operation = createMockOperation()

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      operation,
      request,
      plugins: [],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.cookieHeaderKeys).toEqual(['sessionId=abc123; Path=/; HttpOnly'])
  })

  it('handles missing getSetCookie method gracefully', async () => {
    const request = new Request(MOCK_URL)
    const mockResponse = addUrlToResponse(
      new Response('test', {
        status: 200,
        headers: new Headers(),
      }),
      request.url,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const operation = createMockOperation()

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      operation,
      request,
      plugins: [],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.cookieHeaderKeys).toEqual([])
  })

  describe('response streaming', () => {
    it('streams text/event-stream responses', async () => {
      const request = new Request(MOCK_URL)
      const encoder = new TextEncoder()

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: chunk 1\n\n'))
          controller.enqueue(encoder.encode('data: chunk 2\n\n'))
          controller.close()
        },
      })

      const mockResponse = addUrlToResponse(
        new Response(mockStream, {
          status: 200,
          headers: new Headers({
            'content-type': 'text/event-stream',
          }),
        }),
        request.url,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const operation = createMockOperation()

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      expect(error).toBe(null)
      if (!result || !('reader' in result.response)) {
        throw new Error('No reader')
      }
      expect(result.response.reader).toBeInstanceOf(ReadableStreamDefaultReader)

      // Read and verify the stream contents
      const chunks = []
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await result.response.reader.read()
        if (done) {
          break
        }
        chunks.push(decoder.decode(value, { stream: true }))
      }

      expect(chunks).toEqual(['data: chunk 1\n\n', 'data: chunk 2\n\n'])
    })

    it('does not stream non-SSE responses', async () => {
      const request = new Request(MOCK_URL)
      const mockResponse = addUrlToResponse(
        new Response('regular response', {
          status: 200,
          headers: new Headers({
            'content-type': 'application/json',
          }),
        }),
        request.url,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const operation = createMockOperation()

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('Expected data response, not streaming')
      }
      expect(result.response.data).toBe('regular response')
    })

    it('handles streaming responses without body', async () => {
      const request = new Request(MOCK_URL)
      const mockResponse = addUrlToResponse(
        new Response(null, {
          status: 200,
          headers: new Headers({
            'content-type': 'text/event-stream',
          }),
        }),
        request.url,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const operation = createMockOperation()

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      expect(error).toBe(null)
      // Should fall back to regular response when body is null
      if (!result || !('data' in result.response)) {
        throw new Error('Expected data response')
      }
      // Empty body returns a Blob
      expect(result.response.data).toBeInstanceOf(Blob)
    })
  })

  describe('plugin hooks', () => {
    it('executes beforeRequest hook when plugins are provided', async () => {
      const beforeRequestMock = vi.fn().mockResolvedValue(undefined)
      const mockPlugin: ClientPlugin = {
        hooks: {
          beforeRequest: beforeRequestMock,
        },
      }

      const request = new Request(MOCK_URL)
      const operation = createMockOperation()

      globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(request))

      await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [mockPlugin],
      })

      expect(beforeRequestMock).toHaveBeenCalledWith({ request })
      expect(beforeRequestMock).toHaveBeenCalledTimes(1)
    })

    it('executes beforeRequest hook before making the request', async () => {
      const HEADER_NAME = 'X-Test-Header'
      const HEADER_VALUE = 'test-value'

      const beforeRequestMock = vi.fn().mockImplementation(async (req: { request: Request }) => {
        await new Promise((resolve) => setTimeout(resolve, 1))
        req.request.headers.append(HEADER_NAME, HEADER_VALUE)
        return req
      })

      const mockPlugin: ClientPlugin = {
        hooks: {
          beforeRequest: beforeRequestMock,
        },
      }

      const request = new Request(MOCK_URL)
      const operation = createMockOperation()

      // Mock fetch to create response dynamically based on the modified request
      globalFetchSpy.mockImplementation((input: string | Request | URL) => {
        const req = input instanceof Request ? input : new Request(input.toString())
        return Promise.resolve(createMockEchoResponse(req))
      })

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [mockPlugin],
      })

      expect(error).toBe(null)
      expect(beforeRequestMock).toHaveBeenCalled()
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const responseData = JSON.parse(result.response.data as string)
      expect(responseData.headers[HEADER_NAME.toLowerCase()]).toBe(HEADER_VALUE)
    })

    it('executes responseReceived hook when plugins are provided', async () => {
      const responseReceivedMock = vi.fn().mockResolvedValue(undefined)
      const mockPlugin: ClientPlugin = {
        hooks: {
          responseReceived: responseReceivedMock,
        },
      }

      const request = new Request(MOCK_URL)
      const operation = createMockOperation()

      globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(request))

      await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [mockPlugin],
      })

      expect(responseReceivedMock).toHaveBeenCalledWith({
        response: expect.any(Response),
        request: expect.any(Request),
        operation,
      })
      expect(responseReceivedMock).toHaveBeenCalledTimes(1)
    })

    it('executes responseReceived hook after receiving response', async () => {
      const HEADER_NAME = 'X-Response-Header'
      const HEADER_VALUE = 'response-value'

      let capturedResponse: Response | undefined

      const responseReceivedMock = vi.fn().mockImplementation(async ({ response }) => {
        capturedResponse = response
        await new Promise((resolve) => setTimeout(resolve, 1))
        response.headers.append(HEADER_NAME, HEADER_VALUE)
      })

      const mockPlugin: ClientPlugin = {
        hooks: {
          responseReceived: responseReceivedMock,
        },
      }

      const request = new Request(MOCK_URL)
      const operation = createMockOperation()

      globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(request))

      const [error] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [mockPlugin],
      })

      expect(error).toBe(null)
      expect(responseReceivedMock).toHaveBeenCalled()
      expect(capturedResponse).toBeInstanceOf(Response)
      expect(capturedResponse!.headers.get(HEADER_NAME)).toBe(HEADER_VALUE)
    })

    it('executes multiple plugins in order', async () => {
      const executionOrder: string[] = []

      const plugin1: ClientPlugin = {
        hooks: {
          beforeRequest: vi.fn().mockImplementation((req: Request) => {
            executionOrder.push('plugin-1-before')
            return req
          }),
          responseReceived: vi.fn().mockImplementation(() => {
            executionOrder.push('plugin-1-after')
          }),
        },
      }

      const plugin2: ClientPlugin = {
        hooks: {
          beforeRequest: vi.fn().mockImplementation((req: Request) => {
            executionOrder.push('plugin-2-before')
            return req
          }),
          responseReceived: vi.fn().mockImplementation(() => {
            executionOrder.push('plugin-2-after')
          }),
        },
      }

      const request = new Request(MOCK_URL)
      const operation = createMockOperation()

      globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(request))

      await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [plugin1, plugin2],
      })

      expect(executionOrder).toEqual(['plugin-1-before', 'plugin-2-before', 'plugin-1-after', 'plugin-2-after'])
    })

    it('does not fail when plugins array is empty', async () => {
      const request = new Request(MOCK_URL)
      const operation = createMockOperation()

      globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(request))

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      expect(error).toBe(null)
      expect(result).toBeDefined()
    })

    it('handles plugin errors gracefully', async () => {
      const mockPlugin: ClientPlugin = {
        hooks: {
          beforeRequest: vi.fn().mockRejectedValue(new Error('Plugin failed')),
        },
      }

      const request = new Request(MOCK_URL)
      const operation = createMockOperation()

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [mockPlugin],
      })

      expect(error).not.toBe(null)
      expect(result).toBe(null)
      expect(error?.message).toContain('Plugin failed')
    })
  })

  describe('error handling', () => {
    it('handles network errors', async () => {
      globalFetchSpy.mockRejectedValueOnce(new Error('Network error'))

      const request = new Request(MOCK_URL)
      const operation = createMockOperation()

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      expect(error).not.toBe(null)
      expect(result).toBe(null)
      expect(error?.message).toContain('error')
    })

    it('handles fetch errors', async () => {
      globalFetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      const request = new Request(MOCK_URL)
      const operation = createMockOperation()

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      expect(error).not.toBe(null)
      expect(result).toBe(null)
    })

    it('handles malformed responses', async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers(),
        clone: () => {
          throw new Error('Cannot clone')
        },
      } as Partial<Response>

      globalFetchSpy.mockResolvedValueOnce(mockResponse as Response)

      const request = new Request(MOCK_URL)
      const operation = createMockOperation()

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      expect(error).not.toBe(null)
      expect(result).toBe(null)
    })
  })

  describe('proxy handling', () => {
    it('normalizes headers when using proxy', async () => {
      const request = new Request(MOCK_URL)
      const mockResponse = addUrlToResponse(
        new Response('test', {
          status: 200,
          headers: new Headers({
            'x-scalar-forwarded-header': 'original-value',
          }),
        }),
        request.url,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const operation = createMockOperation()

      const [error, result] = await sendRequest({
        isUsingProxy: true,
        operation,
        request,
        plugins: [],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.headers).toBeDefined()
    })

    it('handles proxy-specific headers', async () => {
      const request = new Request(MOCK_URL)
      const mockResponse = addUrlToResponse(
        new Response('test', {
          status: 200,
          headers: new Headers({
            'x-scalar-cookie': 'session=abc123',
          }),
        }),
        request.url,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const operation = createMockOperation()

      const [error, result] = await sendRequest({
        isUsingProxy: true,
        operation,
        request,
        plugins: [],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.headers).toBeDefined()
    })
  })

  describe('content type handling', () => {
    it('handles JSON responses', async () => {
      const request = new Request(MOCK_URL)
      const mockResponse = addUrlToResponse(
        new Response(JSON.stringify({ test: 'data' }), {
          status: 200,
          headers: new Headers({
            'content-type': 'application/json',
          }),
        }),
        request.url,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const operation = createMockOperation()

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.data).toBe('{"test":"data"}')
    })

    it('handles text/plain responses', async () => {
      const request = new Request(MOCK_URL)
      const mockResponse = addUrlToResponse(
        new Response('plain text response', {
          status: 200,
          headers: new Headers({
            'content-type': 'text/plain',
          }),
        }),
        request.url,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const operation = createMockOperation()

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.data).toBe('plain text response')
    })

    it('handles XML responses', async () => {
      const request = new Request(MOCK_URL)
      const xmlData = '<?xml version="1.0"?><root><item>test</item></root>'
      const mockResponse = addUrlToResponse(
        new Response(xmlData, {
          status: 200,
          headers: new Headers({
            'content-type': 'application/xml',
          }),
        }),
        request.url,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const operation = createMockOperation()

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.data).toBe(xmlData)
    })

    it('handles binary responses', async () => {
      const request = new Request(MOCK_URL)
      const binaryData = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
      const mockResponse = addUrlToResponse(
        new Response(binaryData, {
          status: 200,
          headers: new Headers({
            'content-type': 'image/png',
          }),
        }),
        request.url,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const operation = createMockOperation()

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.data).toBeInstanceOf(Blob)
    })

    it('defaults to text/plain when content-type is missing', async () => {
      const request = new Request(MOCK_URL)
      const mockResponse = addUrlToResponse(
        new Response('test data', {
          status: 200,
          headers: new Headers(),
        }),
        request.url,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const operation = createMockOperation()

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.data).toBe('test data')
    })
  })

  describe('path extraction', () => {
    it('extracts path from response URL', async () => {
      const request = new Request(`${MOCK_URL}/api/users`)
      const operation = createMockOperation()

      globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(request))

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.path).toBe('/api/users')
    })

    it('includes query parameters in path', async () => {
      const request = new Request(`${MOCK_URL}/api/users?page=1&limit=10`)
      const operation = createMockOperation()

      globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(request))

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.path).toBe('/api/users?page=1&limit=10')
    })

    it('handles root path', async () => {
      const request = new Request(MOCK_URL)
      const operation = createMockOperation()

      globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(request))

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.path).toBe('/')
    })
  })

  describe('timestamp', () => {
    it('includes timestamp in response', async () => {
      const beforeTime = Date.now()

      const request = new Request(MOCK_URL)
      const operation = createMockOperation()

      globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(request))

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        operation,
        request,
        plugins: [],
      })

      const afterTime = Date.now()

      expect(error).toBe(null)
      expect(result?.timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(result?.timestamp).toBeLessThanOrEqual(afterTime)
    })
  })
})
