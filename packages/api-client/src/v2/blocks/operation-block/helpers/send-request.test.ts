import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { sendRequest } from './send-request'

const MOCK_URL = 'https://api.example.com'

const globalFetchSpy = vi.spyOn(global, 'fetch')
afterEach(() => {
  globalFetchSpy.mockReset()
})

describe('sendRequest', () => {
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
  const createMockEchoResponse = (url: string, init: RequestInit = {}, overrides: Partial<ResponseInit> = {}) => {
    const parsedUrl = new URL(url)
    const query: Record<string, string | string[]> = {}

    parsedUrl.searchParams.forEach((value, key) => {
      if (query[key]) {
        query[key] = Array.isArray(query[key]) ? [...(query[key] as string[]), value] : [query[key] as string, value]
      } else {
        query[key] = value
      }
    })

    const headers: Record<string, string> = {}
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value
      })
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([key, value]) => {
        headers[key.toLowerCase()] = value
      })
    } else if (init.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        headers[key.toLowerCase()] = value
      })
    }

    const echoData = {
      method: init.method ?? 'GET',
      path: parsedUrl.pathname + parsedUrl.search,
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

    return addUrlToResponse(response, url)
  }

  it('sends a basic request and returns response data', async () => {
    const requestInit: RequestInit = {}
    globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(MOCK_URL, requestInit))

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: [MOCK_URL, requestInit],
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
    const requestInit: RequestInit = {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
    }
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
      MOCK_URL,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: [MOCK_URL, requestInit],
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
    const requestUrl = url.toString()
    const requestInit: RequestInit = {}

    globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(requestUrl, requestInit))

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: [requestUrl, requestInit],
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
    const requestInit: RequestInit = {
      headers: {
        'X-Custom-Header': 'custom-value',
        'Content-Type': 'application/json',
      },
    }

    globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(MOCK_URL, requestInit))

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: [MOCK_URL, requestInit],
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
    const requestInit: RequestInit = {}
    const mockResponse = addUrlToResponse(
      new Response('test', {
        status: 200,
        headers: new Headers({
          'content-type': 'text/plain',
          'x-custom-header': 'value',
        }),
      }),
      MOCK_URL,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: [MOCK_URL, requestInit],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.headers).toHaveProperty('Content-Type')
    expect(result.response.headers).toHaveProperty('X-Custom-Header')
  })

  it('handles 204 No Content responses', async () => {
    const requestInit: RequestInit = {}
    const mockResponse = addUrlToResponse(
      new Response(null, {
        status: 204,
        statusText: 'No Content',
      }),
      `${MOCK_URL}/204`,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: [`${MOCK_URL}/204`, requestInit],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.status).toBe(204)
    expect(result.response.data).toBe('')
  })

  it('handles 205 Reset Content responses', async () => {
    const requestInit: RequestInit = {}
    const mockResponse = addUrlToResponse(
      new Response(null, {
        status: 205,
        statusText: 'Reset Content',
      }),
      MOCK_URL,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: [MOCK_URL, requestInit],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.status).toBe(205)
  })

  it('handles 304 Not Modified responses', async () => {
    const requestInit: RequestInit = {}
    const mockResponse = addUrlToResponse(
      new Response(null, {
        status: 304,
        statusText: 'Not Modified',
      }),
      MOCK_URL,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: [MOCK_URL, requestInit],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.status).toBe(304)
  })

  it('handles responses with status codes', async () => {
    const requestInit: RequestInit = {}
    const mockResponse = addUrlToResponse(
      new Response('OK', {
        status: 200,
        statusText: 'OK',
      }),
      MOCK_URL,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: [MOCK_URL, requestInit],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.status).toBe(200)
  })

  it('handles error status codes', async () => {
    const requestInit: RequestInit = {}
    const mockResponse = addUrlToResponse(
      new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      }),
      MOCK_URL,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: [MOCK_URL, requestInit],
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

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: [MOCK_URL, {}],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.data).toBe('')
  })

  it('calculates response duration', async () => {
    const requestInit: RequestInit = {}
    globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(MOCK_URL, requestInit))

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: [MOCK_URL, requestInit],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.duration).toBeGreaterThanOrEqual(0)
    expect(typeof result.response.duration).toBe('number')
  })

  it('includes response size in bytes', async () => {
    const requestInit: RequestInit = {}
    globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(MOCK_URL, requestInit))

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: [MOCK_URL, requestInit],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.size).toBeGreaterThan(0)
    expect(typeof result.response.size).toBe('number')
  })

  it('extracts cookie headers when available', async () => {
    const requestInit: RequestInit = {}
    const mockResponse = addUrlToResponse(
      new Response('test', {
        status: 200,
        headers: new Headers({
          'set-cookie': 'sessionId=abc123; Path=/; HttpOnly',
        }),
      }),
      MOCK_URL,
    )

    // Mock getSetCookie method
    Object.defineProperty(mockResponse.headers, 'getSetCookie', {
      value: () => ['sessionId=abc123; Path=/; HttpOnly'],
      writable: true,
    })

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: [MOCK_URL, requestInit],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.cookieHeaderKeys).toEqual(['sessionId=abc123; Path=/; HttpOnly'])
  })

  it('handles missing getSetCookie method gracefully', async () => {
    const requestInit: RequestInit = {}
    const mockResponse = addUrlToResponse(
      new Response('test', {
        status: 200,
        headers: new Headers(),
      }),
      MOCK_URL,
    )

    globalFetchSpy.mockResolvedValueOnce(mockResponse)

    const [error, result] = await sendRequest({
      isUsingProxy: false,
      requestPayload: [MOCK_URL, requestInit],
    })

    expect(error).toBe(null)
    if (!result || !('data' in result.response)) {
      throw new Error('No data')
    }
    expect(result.response.cookieHeaderKeys).toEqual([])
  })

  describe('response streaming', () => {
    it('streams text/event-stream responses', async () => {
      const requestInit: RequestInit = {}
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
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
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
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response('regular response', {
          status: 200,
          headers: new Headers({
            'content-type': 'application/json',
          }),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('Expected data response, not streaming')
      }
      expect(result.response.data).toBe('regular response')
    })

    it('handles streaming responses without body', async () => {
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response(null, {
          status: 200,
          headers: new Headers({
            'content-type': 'text/event-stream',
          }),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
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

  describe('error handling', () => {
    it('handles network errors', async () => {
      globalFetchSpy.mockRejectedValueOnce(new Error('Network error'))

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, {}],
      })

      expect(error).not.toBe(null)
      expect(result).toBe(null)
      expect(error?.message).toContain('error')
    })

    it('handles fetch errors', async () => {
      globalFetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, {}],
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

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, {}],
      })

      expect(error).not.toBe(null)
      expect(result).toBe(null)
    })
  })

  describe('proxy handling', () => {
    it('normalizes headers when using proxy', async () => {
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response('test', {
          status: 200,
          headers: new Headers({
            'x-scalar-forwarded-header': 'original-value',
          }),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: true,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.headers).toBeDefined()
    })

    it('handles proxy-specific headers', async () => {
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response('test', {
          status: 200,
          headers: new Headers({
            'x-scalar-cookie': 'session=abc123',
          }),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: true,
        requestPayload: [MOCK_URL, requestInit],
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
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response(JSON.stringify({ test: 'data' }), {
          status: 200,
          headers: new Headers({
            'content-type': 'application/json',
          }),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.data).toBe('{"test":"data"}')
    })

    it('handles text/plain responses', async () => {
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response('plain text response', {
          status: 200,
          headers: new Headers({
            'content-type': 'text/plain',
          }),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.data).toBe('plain text response')
    })

    it('handles XML responses', async () => {
      const requestInit: RequestInit = {}
      const xmlData = '<?xml version="1.0"?><root><item>test</item></root>'
      const mockResponse = addUrlToResponse(
        new Response(xmlData, {
          status: 200,
          headers: new Headers({
            'content-type': 'application/xml',
          }),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.data).toBe(xmlData)
    })

    it('handles binary responses', async () => {
      const requestInit: RequestInit = {}
      const binaryData = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
      const mockResponse = addUrlToResponse(
        new Response(binaryData, {
          status: 200,
          headers: new Headers({
            'content-type': 'image/png',
          }),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.data).toBeInstanceOf(Blob)
    })

    it('defaults to text/plain when content-type is missing', async () => {
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response('test data', {
          status: 200,
          headers: new Headers(),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.data).toBe('test data')
    })

    it('uses the text/plain fallback to resolve plugin decoders when content-type is missing', async () => {
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response('test data', {
          status: 200,
          headers: new Headers(),
        }),
        MOCK_URL,
      )
      const decode = vi.fn(() => 'decoded via plugin')
      const plugin: ClientPlugin = {
        responseBody: [
          {
            mimeTypes: ['text/plain'],
            decode,
            language: 'plaintext',
          },
        ],
      }

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
        plugins: [plugin],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.data).toBe('decoded via plugin')
      expect(decode).toHaveBeenCalledTimes(1)
      expect(decode).toHaveBeenCalledWith(expect.any(ArrayBuffer), 'text/plain;charset=UTF-8')
    })
  })

  describe('path extraction', () => {
    it('extracts path from response URL', async () => {
      const requestUrl = `${MOCK_URL}/api/users`
      const requestInit: RequestInit = {}
      globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(requestUrl, requestInit))

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [requestUrl, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.path).toBe('/api/users')
    })

    it('includes query parameters in path', async () => {
      const requestUrl = `${MOCK_URL}/api/users?page=1&limit=10`
      const requestInit: RequestInit = {}

      globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(requestUrl, requestInit))

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [requestUrl, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.path).toBe('/api/users?page=1&limit=10')
    })

    it('handles root path', async () => {
      const requestInit: RequestInit = {}

      globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(MOCK_URL, requestInit))

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
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
      const requestInit: RequestInit = {}

      globalFetchSpy.mockResolvedValueOnce(createMockEchoResponse(MOCK_URL, requestInit))

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      const afterTime = Date.now()

      expect(error).toBe(null)
      expect(result?.timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(result?.timestamp).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('custom cookie header (x-scalar-set-cookie)', () => {
    it('extracts a single cookie from the custom cookie header', async () => {
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response('ok', {
          status: 200,
          headers: new Headers({
            'content-type': 'text/plain',
            'x-scalar-set-cookie': 'sessionId=abc123; Path=/; HttpOnly',
          }),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.cookieHeaderKeys).toStrictEqual(['sessionId=abc123; Path=/; HttpOnly'])
    })

    it('extracts multiple cookies from the custom cookie header', async () => {
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response('ok', {
          status: 200,
          headers: new Headers({
            'content-type': 'text/plain',
            'x-scalar-set-cookie': 'a=1; Path=/, b=2; Path=/api; Secure',
          }),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.cookieHeaderKeys).toStrictEqual(['a=1; Path=/', 'b=2; Path=/api; Secure'])
    })

    it('preserves cookie attributes like Domain, Max-Age, and SameSite', async () => {
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response('ok', {
          status: 200,
          headers: new Headers({
            'content-type': 'text/plain',
            'x-scalar-set-cookie':
              'token=xyz; Domain=.example.com; Path=/; Max-Age=3600; Secure; HttpOnly; SameSite=Strict',
          }),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const [cookieStr] = result.response.cookieHeaderKeys
      expect(cookieStr).toContain('token=xyz')
      expect(cookieStr).toContain('Domain=.example.com')
      expect(cookieStr).toContain('Max-Age=3600')
      expect(cookieStr).toContain('Secure')
      expect(cookieStr).toContain('HttpOnly')
      expect(cookieStr).toContain('SameSite=Strict')
    })

    it('uses custom cookies instead of getSetCookie when the header is present', async () => {
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response('ok', {
          status: 200,
          headers: new Headers({
            'content-type': 'text/plain',
            'x-scalar-set-cookie': 'sid=abc; Path=/',
            'set-cookie': 'ignored=yes; Path=/',
          }),
        }),
        MOCK_URL,
      )

      Object.defineProperty(mockResponse.headers, 'getSetCookie', {
        value: () => ['ignored=yes; Path=/'],
        writable: true,
      })

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.cookieHeaderKeys).toStrictEqual(['sid=abc; Path=/'])
    })

    it('falls back to getSetCookie when custom cookie header is absent', async () => {
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response('ok', {
          status: 200,
          headers: new Headers({
            'content-type': 'text/plain',
            'set-cookie': 'fallback=yes; Path=/',
          }),
        }),
        MOCK_URL,
      )

      Object.defineProperty(mockResponse.headers, 'getSetCookie', {
        value: () => ['fallback=yes; Path=/'],
        writable: true,
      })

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.cookieHeaderKeys).toStrictEqual(['fallback=yes; Path=/'])
    })

    it('returns empty cookieHeaderKeys when neither custom nor set-cookie headers exist', async () => {
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response('ok', {
          status: 200,
          headers: new Headers({
            'content-type': 'text/plain',
          }),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.cookieHeaderKeys).toStrictEqual([])
    })

    it('extracts custom cookies from streaming responses', async () => {
      const requestInit: RequestInit = {}
      const encoder = new TextEncoder()

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('data: hello\n\n'))
          controller.close()
        },
      })

      const mockResponse = addUrlToResponse(
        new Response(mockStream, {
          status: 200,
          headers: new Headers({
            'content-type': 'text/event-stream',
            'x-scalar-set-cookie': 'stream_sid=s123; Path=/; HttpOnly',
          }),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('reader' in result.response)) {
        throw new Error('No reader')
      }
      expect(result.response.cookieHeaderKeys).toStrictEqual(['stream_sid=s123; Path=/; HttpOnly'])
    })

    it('handles an empty x-scalar-set-cookie header value', async () => {
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response('ok', {
          status: 200,
          headers: new Headers({
            'content-type': 'text/plain',
            'x-scalar-set-cookie': '',
          }),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      expect(result.response.cookieHeaderKeys).toStrictEqual([])
    })

    it('preserves values with special characters through the encode passthrough', async () => {
      const requestInit: RequestInit = {}
      const mockResponse = addUrlToResponse(
        new Response('ok', {
          status: 200,
          headers: new Headers({
            'content-type': 'text/plain',
            'x-scalar-set-cookie': 'token=abc123def456; Path=/',
          }),
        }),
        MOCK_URL,
      )

      globalFetchSpy.mockResolvedValueOnce(mockResponse)

      const [error, result] = await sendRequest({
        isUsingProxy: false,
        requestPayload: [MOCK_URL, requestInit],
      })

      expect(error).toBe(null)
      if (!result || !('data' in result.response)) {
        throw new Error('No data')
      }
      const [cookieStr] = result.response.cookieHeaderKeys
      expect(cookieStr).toBe('token=abc123def456; Path=/')
    })
  })
})
