import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('undici', () => {
  class MockAgent {}
  return { request: vi.fn(), Agent: MockAgent }
})

import { request as undiciRequest } from 'undici'

import type { IpcSender } from './handle-custom-fetch'
import { abortMap, handleCustomFetch } from './handle-custom-fetch'

const mockRequest = vi.mocked(undiciRequest)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MockUndiciResponseOptions = {
  statusCode?: number
  /** Header map: string values or string[] for multi-value headers. */
  headers?: Record<string, string | string[]>
  body?: ArrayBuffer
  /** Optional async-iterable chunks for streaming response bodies. */
  chunks?: Uint8Array[]
}

/**
 * Build a minimal object matching the shape that `undici.request()` resolves with.
 * When `chunks` is provided the body also exposes an async iterator used by the
 * streaming path.
 */
function createMockUndiciResponse({
  statusCode = 200,
  headers = {},
  body = new ArrayBuffer(0),
  chunks,
}: MockUndiciResponseOptions = {}) {
  const bodyObj: Record<string | symbol, unknown> = {
    arrayBuffer: vi.fn().mockResolvedValue(body),
  }
  if (chunks) {
    bodyObj[Symbol.asyncIterator] = function* () {
      for (const chunk of chunks) {
        yield chunk
      }
    }
  }
  return { statusCode, headers, body: bodyObj }
}

/** Create a mock IpcSender for testing the streaming path. */
function createMockSender(): {
  mock: IpcSender
  sent: Array<[string, unknown]>
} {
  const sent: Array<[string, unknown]> = []
  const mock: IpcSender = {
    send: vi.fn((channel: string, ...args: unknown[]) => {
      sent.push([channel, args[0]])
    }),
    isDestroyed: vi.fn().mockReturnValue(false),
  }
  return { mock, sent }
}

/** Flush pending microtasks so fire-and-forget async IIFEs complete. */
const flushAsync = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  mockRequest.mockReset()
  mockRequest.mockResolvedValue(createMockUndiciResponse() as never)
  abortMap.clear()
})

/** The options object passed to the last undici.request() call. */
function lastOptions(): Record<string, unknown> {
  return mockRequest.mock.calls[mockRequest.mock.calls.length - 1]![1]! as Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('handleCustomFetch', () => {
  // =========================================================================
  describe('basic passthrough', () => {
    it('passes the URL to undici', async () => {
      await handleCustomFetch({ url: 'https://example.com' })
      expect(mockRequest.mock.calls[0]![0]!).toBe('https://example.com')
    })

    it('passes the method', async () => {
      await handleCustomFetch({ url: 'https://example.com', method: 'DELETE' })
      expect(lastOptions().method).toBe('DELETE')
    })

    it('defaults method to GET when not provided', async () => {
      await handleCustomFetch({ url: 'https://example.com' })
      expect(lastOptions().method).toBe('GET')
    })

    it('passes the body to undici as a Buffer (including for GET requests)', async () => {
      const bytes = new TextEncoder().encode('{"q":"search"}')
      const body = bytes.buffer as ArrayBuffer
      await handleCustomFetch({
        url: 'https://example.com',
        method: 'GET',
        body,
      })
      expect(lastOptions().body).toBeInstanceOf(Buffer)
      expect(lastOptions().body as Buffer).toEqual(Buffer.from(body))
    })

    it('passes undefined body to undici when no body is in the request', async () => {
      await handleCustomFetch({ url: 'https://example.com', method: 'GET' })
      expect(lastOptions().body).toBeUndefined()
    })

    it('passes an empty ArrayBuffer body to undici as an empty Buffer', async () => {
      const body = new ArrayBuffer(0)
      await handleCustomFetch({
        url: 'https://example.com',
        method: 'POST',
        body,
      })
      expect(lastOptions().body).toBeInstanceOf(Buffer)
      expect((lastOptions().body as Buffer).byteLength).toBe(0)
    })

    it('always passes the persistent agent dispatcher', async () => {
      await handleCustomFetch({ url: 'https://example.com' })
      await handleCustomFetch({ url: 'https://example.com' })
      const dispatchers = mockRequest.mock.calls.map((c) => (c[1] as Record<string, unknown>).dispatcher)
      expect(dispatchers[0]).toBeDefined()
      expect(dispatchers[1]).toBe(dispatchers[0])
    })
  })

  // =========================================================================
  describe('response serialization', () => {
    it('returns the correct status code', async () => {
      mockRequest.mockResolvedValue(createMockUndiciResponse({ statusCode: 404 }) as never)
      const result = await handleCustomFetch({ url: 'https://example.com' })
      expect(result.status).toBe(404)
    })

    it('derives statusText from the status code', async () => {
      mockRequest.mockResolvedValue(createMockUndiciResponse({ statusCode: 404 }) as never)
      const result = await handleCustomFetch({ url: 'https://example.com' })
      expect(result.statusText).toBe('Not Found')
    })

    it('returns empty statusText for unknown status codes', async () => {
      mockRequest.mockResolvedValue(createMockUndiciResponse({ statusCode: 599 }) as never)
      const result = await handleCustomFetch({ url: 'https://example.com' })
      expect(result.statusText).toBe('')
    })

    it('serializes single-value response headers as [name, value] tuples', async () => {
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: {
            'content-type': 'application/json',
            'x-rate-limit': '100',
          },
        }) as never,
      )
      const result = await handleCustomFetch({ url: 'https://example.com' })
      expect(result.headers).toContainEqual(['content-type', 'application/json'])
      expect(result.headers).toContainEqual(['x-rate-limit', '100'])
    })

    it('expands string[] header values into individual tuples', async () => {
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'set-cookie': ['a=1; Path=/', 'b=2; HttpOnly'] },
        }) as never,
      )
      const result = await handleCustomFetch({ url: 'https://example.com' })
      const setCookies = result.headers.filter(([k]) => k === 'set-cookie')
      expect(setCookies).toHaveLength(2)
      expect(setCookies[0]![1]!).toBe('a=1; Path=/')
      expect(setCookies[1]![1]!).toBe('b=2; HttpOnly')
    })

    it('returns the response body as an ArrayBuffer', async () => {
      const body = new TextEncoder().encode('hello').buffer as ArrayBuffer
      mockRequest.mockResolvedValue(createMockUndiciResponse({ body }) as never)
      const result = await handleCustomFetch({ url: 'https://example.com' })
      expect(new TextDecoder().decode(result.body ?? undefined)).toBe('hello')
    })
  })

  // =========================================================================
  describe('x-scalar-cookie → Cookie (request transform)', () => {
    it('promotes x-scalar-cookie to Cookie and removes the extension header', async () => {
      await handleCustomFetch({
        url: 'https://example.com',
        headers: { 'x-scalar-cookie': 'session=abc123' },
      })
      const headers = lastOptions().headers as Record<string, string>
      expect(headers['cookie']).toBe('session=abc123')
      expect(headers['x-scalar-cookie']).toBeUndefined()
    })

    it('is case-insensitive for the x-scalar-cookie header name', async () => {
      await handleCustomFetch({
        url: 'https://example.com',
        headers: { 'X-Scalar-Cookie': 'token=xyz' },
      })
      const headers = lastOptions().headers as Record<string, string>
      expect(headers['cookie']).toBe('token=xyz')
      expect(headers['x-scalar-cookie']).toBeUndefined()
      expect(headers['X-Scalar-Cookie']).toBeUndefined()
    })

    it('does not set Cookie when x-scalar-cookie is absent', async () => {
      await handleCustomFetch({
        url: 'https://example.com',
        headers: { authorization: 'Bearer token' },
      })
      const headers = lastOptions().headers as Record<string, string>
      expect(headers['cookie']).toBeUndefined()
    })

    it('preserves an existing Cookie header when x-scalar-cookie is absent', async () => {
      await handleCustomFetch({
        url: 'https://example.com',
        headers: { cookie: 'existing=1' },
      })
      const headers = lastOptions().headers as Record<string, string>
      expect(headers['cookie']).toBe('existing=1')
    })
  })

  // =========================================================================
  describe('x-scalar-user-agent → User-Agent (request transform)', () => {
    it('promotes x-scalar-user-agent to User-Agent and removes the extension header', async () => {
      await handleCustomFetch({
        url: 'https://example.com',
        headers: { 'x-scalar-user-agent': 'MyApp/1.0' },
      })
      const headers = lastOptions().headers as Record<string, string>
      expect(headers['user-agent']).toBe('MyApp/1.0')
      expect(headers['x-scalar-user-agent']).toBeUndefined()
    })

    it('is case-insensitive for the x-scalar-user-agent header name', async () => {
      await handleCustomFetch({
        url: 'https://example.com',
        headers: { 'X-Scalar-User-Agent': 'CustomAgent/2' },
      })
      const headers = lastOptions().headers as Record<string, string>
      expect(headers['user-agent']).toBe('CustomAgent/2')
      expect(headers['x-scalar-user-agent']).toBeUndefined()
      expect(headers['X-Scalar-User-Agent']).toBeUndefined()
    })

    it('does not set User-Agent when x-scalar-user-agent is absent', async () => {
      await handleCustomFetch({
        url: 'https://example.com',
        headers: { accept: 'application/json' },
      })
      const headers = lastOptions().headers as Record<string, string>
      expect(headers['user-agent']).toBeUndefined()
    })

    it('overwrites an existing User-Agent when x-scalar-user-agent is present', async () => {
      await handleCustomFetch({
        url: 'https://example.com',
        headers: {
          'user-agent': 'OldAgent/1',
          'x-scalar-user-agent': 'NewAgent/2',
        },
      })
      const headers = lastOptions().headers as Record<string, string>
      expect(headers['user-agent']).toBe('NewAgent/2')
      expect(headers['x-scalar-user-agent']).toBeUndefined()
    })
  })

  // =========================================================================
  describe('both request transforms together', () => {
    it('applies both transformations in a single request', async () => {
      await handleCustomFetch({
        url: 'https://example.com',
        headers: {
          'x-scalar-cookie': 'sid=1',
          'x-scalar-user-agent': 'ScalarApp/3',
          authorization: 'Bearer tok',
        },
      })
      const headers = lastOptions().headers as Record<string, string>
      expect(headers['cookie']).toBe('sid=1')
      expect(headers['user-agent']).toBe('ScalarApp/3')
      expect(headers['authorization']).toBe('Bearer tok')
      expect(headers['x-scalar-cookie']).toBeUndefined()
      expect(headers['x-scalar-user-agent']).toBeUndefined()
    })
  })

  // =========================================================================
  describe('null-body status codes (204, 205, 304)', () => {
    it('returns a null body for 204 No Content', async () => {
      mockRequest.mockResolvedValue(createMockUndiciResponse({ statusCode: 204 }) as never)
      const result = await handleCustomFetch({
        url: 'https://example.com',
        method: 'DELETE',
      })
      expect(result.body).toBeNull()
    })

    it('returns a null body for 205 Reset Content', async () => {
      mockRequest.mockResolvedValue(createMockUndiciResponse({ statusCode: 205 }) as never)
      const result = await handleCustomFetch({ url: 'https://example.com' })
      expect(result.body).toBeNull()
    })

    it('returns a null body for 304 Not Modified', async () => {
      mockRequest.mockResolvedValue(createMockUndiciResponse({ statusCode: 304 }) as never)
      const result = await handleCustomFetch({ url: 'https://example.com' })
      expect(result.body).toBeNull()
    })

    it('still returns the buffered body for normal 200 responses (regression)', async () => {
      const body = new TextEncoder().encode('ok').buffer as ArrayBuffer
      mockRequest.mockResolvedValue(createMockUndiciResponse({ body }) as never)
      const result = await handleCustomFetch({ url: 'https://example.com' })
      expect(result.body).not.toBeNull()
      expect(new TextDecoder().decode(result.body!)).toBe('ok')
    })
  })

  // =========================================================================
  describe('x-scalar-set-cookie ← set-cookie (response transform)', () => {
    it('copies a single Set-Cookie value into x-scalar-set-cookie', async () => {
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'set-cookie': 'a=1; Path=/' },
        }) as never,
      )
      const result = await handleCustomFetch({ url: 'https://example.com' })
      const xSetCookie = result.headers.find(([k]) => k === 'x-scalar-set-cookie')
      expect(xSetCookie?.[1]).toBe('a=1; Path=/')
    })

    it('joins multiple Set-Cookie values with ", " in x-scalar-set-cookie', async () => {
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'set-cookie': ['a=1; Path=/', 'b=2; HttpOnly'] },
        }) as never,
      )
      const result = await handleCustomFetch({ url: 'https://example.com' })
      const xSetCookie = result.headers.find(([k]) => k === 'x-scalar-set-cookie')
      expect(xSetCookie?.[1]).toContain('a=1; Path=/')
      expect(xSetCookie?.[1]).toContain('b=2; HttpOnly')
    })

    it('does not add x-scalar-set-cookie when there is no Set-Cookie header', async () => {
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'content-type': 'application/json' },
        }) as never,
      )
      const result = await handleCustomFetch({ url: 'https://example.com' })
      expect(result.headers.find(([k]) => k === 'x-scalar-set-cookie')).toBeUndefined()
    })
  })

  // =========================================================================
  describe('AbortController', () => {
    it('passes an AbortSignal to undici', async () => {
      await handleCustomFetch({ url: 'https://example.com', abortId: 'abc' })
      expect(lastOptions().signal).toBeInstanceOf(AbortSignal)
    })

    it('registers the AbortController in abortMap while the request is in flight', async () => {
      // Delay resolution so we can inspect the map mid-flight.
      let resolveRequest!: () => void
      mockRequest.mockReturnValue(
        new Promise<ReturnType<typeof createMockUndiciResponse>>((resolve) => {
          resolveRequest = () => resolve(createMockUndiciResponse() as never)
        }) as never,
      )

      const fetchPromise = handleCustomFetch({
        url: 'https://example.com',
        abortId: 'in-flight-id',
      })

      expect(abortMap.has('in-flight-id')).toBe(true)
      resolveRequest()
      await fetchPromise
    })

    it('removes the AbortController from abortMap after the request completes', async () => {
      await handleCustomFetch({
        url: 'https://example.com',
        abortId: 'done-id',
      })
      expect(abortMap.has('done-id')).toBe(false)
    })

    it('removes the AbortController from abortMap even when undici throws', async () => {
      mockRequest.mockRejectedValue(new Error('network error'))
      await expect(handleCustomFetch({ url: 'https://example.com', abortId: 'err-id' })).rejects.toThrow(
        'network error',
      )
      expect(abortMap.has('err-id')).toBe(false)
    })

    it('aborts the undici request when the stored controller is aborted', async () => {
      let resolveRequest!: () => void
      mockRequest.mockReturnValue(
        new Promise<never>((_, reject) => {
          resolveRequest = () => reject(new DOMException('Aborted', 'AbortError'))
        }) as never,
      )

      const fetchPromise = handleCustomFetch({
        url: 'https://example.com',
        abortId: 'abort-me',
      })

      abortMap.get('abort-me')?.abort()
      resolveRequest()

      await expect(fetchPromise).rejects.toThrow('Aborted')
    })

    it('stops the streaming loop when the signal is aborted mid-stream', async () => {
      const encoder = new TextEncoder()
      const { mock: sender, sent } = createMockSender()

      // The iterator yields chunk 1 synchronously, then yields the event loop
      // via setTimeout before chunk 2 — giving us a window to call abort().
      const controlledBody = {
        arrayBuffer: vi.fn(),
        async *[Symbol.asyncIterator]() {
          yield encoder.encode('data: first\n\n')
          await new Promise<void>((resolve) => setTimeout(resolve, 0))
          yield encoder.encode('data: second\n\n')
        },
      }
      mockRequest.mockResolvedValue({
        statusCode: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: controlledBody,
      } as never)

      // The handle resolves before the IIFE starts iterating.
      await handleCustomFetch({ url: 'https://example.com/events', abortId: 'stream-abort' }, sender)

      // Flush once: the IIFE starts, sends chunk 1, then pauses at the
      // setTimeout before chunk 2, yielding control back.
      await flushAsync()

      // Abort while the iterator is paused between chunks.
      abortMap.get('stream-abort')?.abort()

      // Flush again: the iterator resumes, chunk 2 is yielded, the loop body
      // checks ac.signal.aborted → true → returns without sending.
      await flushAsync()

      const dataEvents = sent.filter(([ch]) => ch === 'customFetch:data')
      expect(dataEvents).toHaveLength(1)
      expect(new TextDecoder().decode((dataEvents[0]![1]! as { chunk: ArrayBuffer }).chunk)).toBe('data: first\n\n')
      // No end event should follow an abort.
      expect(sent.filter(([ch]) => ch === 'customFetch:end')).toHaveLength(0)
    })

    it('does not register in abortMap when no abortId is provided', async () => {
      await handleCustomFetch({ url: 'https://example.com' })
      expect(abortMap.size).toBe(0)
    })
  })

  // =========================================================================
  describe('SSE / streaming responses', () => {
    it('returns a streamId for an SSE response', async () => {
      const { mock: sender } = createMockSender()
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'content-type': 'text/event-stream' },
          chunks: [new TextEncoder().encode('data: hello\n\n')],
        }) as never,
      )

      const result = await handleCustomFetch({ url: 'https://example.com/events' }, sender)

      expect(result.streamId).toBeDefined()
      expect(typeof result.streamId).toBe('string')
    })

    it('returns a null body for an SSE response', async () => {
      const { mock: sender } = createMockSender()
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'content-type': 'text/event-stream' },
          chunks: [],
        }) as never,
      )

      const result = await handleCustomFetch({ url: 'https://example.com/events' }, sender)

      expect(result.body).toBeNull()
    })

    it('sends customFetch:data events for each chunk', async () => {
      const encoder = new TextEncoder()
      const { mock: sender, sent } = createMockSender()
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'content-type': 'text/event-stream' },
          chunks: [encoder.encode('data: first\n\n'), encoder.encode('data: second\n\n')],
        }) as never,
      )

      const result = await handleCustomFetch({ url: 'https://example.com/events' }, sender)
      await flushAsync()

      const dataEvents = sent.filter(([ch]) => ch === 'customFetch:data')
      expect(dataEvents).toHaveLength(2)

      const firstPayload = dataEvents[0]![1]! as {
        streamId: string
        chunk: ArrayBuffer
      }
      expect(firstPayload.streamId).toBe(result.streamId)
      expect(new TextDecoder().decode(firstPayload.chunk)).toBe('data: first\n\n')

      const secondPayload = dataEvents[1]![1]! as {
        streamId: string
        chunk: ArrayBuffer
      }
      expect(new TextDecoder().decode(secondPayload.chunk)).toBe('data: second\n\n')
    })

    it('sends a customFetch:end event after all chunks', async () => {
      const { mock: sender, sent } = createMockSender()
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'content-type': 'text/event-stream' },
          chunks: [new TextEncoder().encode('data: done\n\n')],
        }) as never,
      )

      const result = await handleCustomFetch({ url: 'https://example.com/events' }, sender)
      await flushAsync()

      const endEvent = sent.find(([ch]) => ch === 'customFetch:end')
      expect(endEvent).toBeDefined()
      expect((endEvent![1] as { streamId: string }).streamId).toBe(result.streamId)
    })

    it('sends a customFetch:error event when the body iterator throws', async () => {
      const { mock: sender, sent } = createMockSender()

      const bodyWithError = {
        arrayBuffer: vi.fn(),
        [Symbol.asyncIterator]() {
          throw new Error('network dropped')
        },
      }
      mockRequest.mockResolvedValue({
        statusCode: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: bodyWithError,
      } as never)

      const result = await handleCustomFetch({ url: 'https://example.com/events' }, sender)
      await flushAsync()

      const errorEvent = sent.find(([ch]) => ch === 'customFetch:error')
      expect(errorEvent).toBeDefined()
      const payload = errorEvent![1] as { streamId: string; message: string }
      expect(payload.streamId).toBe(result.streamId)
      expect(payload.message).toContain('network dropped')
    })

    it('stops streaming when the sender is destroyed mid-stream', async () => {
      const encoder = new TextEncoder()
      const { mock: sender, sent } = createMockSender()

      let destroyAfter = 1
      vi.mocked(sender.isDestroyed).mockImplementation(() => --destroyAfter < 0)

      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'content-type': 'text/event-stream' },
          chunks: [
            encoder.encode('data: first\n\n'),
            encoder.encode('data: second\n\n'),
            encoder.encode('data: third\n\n'),
          ],
        }) as never,
      )

      await handleCustomFetch({ url: 'https://example.com/events' }, sender)
      await flushAsync()

      const dataEvents = sent.filter(([ch]) => ch === 'customFetch:data')
      expect(dataEvents.length).toBeLessThan(3)
    })

    it('falls back to buffered response for non-streaming content types', async () => {
      const { mock: sender } = createMockSender()
      const body = new TextEncoder().encode('{"ok":true}').buffer as ArrayBuffer
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'content-type': 'application/json' },
          body,
        }) as never,
      )

      const result = await handleCustomFetch({ url: 'https://example.com/api' }, sender)

      expect(result.streamId).toBeUndefined()
      expect(result.body).not.toBeNull()
    })

    it('falls back to buffered response when no sender is provided', async () => {
      const body = new TextEncoder().encode('data: hello\n\n').buffer as ArrayBuffer
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'content-type': 'text/event-stream' },
          body,
        }) as never,
      )

      const result = await handleCustomFetch({
        url: 'https://example.com/events',
      })

      expect(result.streamId).toBeUndefined()
      expect(result.body).not.toBeNull()
    })

    // --- Transfer-Encoding: chunked ---

    it('returns a streamId for a Transfer-Encoding: chunked response', async () => {
      const { mock: sender } = createMockSender()
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'transfer-encoding': 'chunked' },
          chunks: [new TextEncoder().encode('{"partial":true}')],
        }) as never,
      )

      const result = await handleCustomFetch({ url: 'https://example.com/stream' }, sender)

      expect(result.streamId).toBeDefined()
      expect(result.body).toBeNull()
    })

    it('streams chunks for a Transfer-Encoding: chunked response', async () => {
      const encoder = new TextEncoder()
      const { mock: sender, sent } = createMockSender()
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'transfer-encoding': 'chunked' },
          chunks: [encoder.encode('chunk-one'), encoder.encode('chunk-two')],
        }) as never,
      )

      const result = await handleCustomFetch({ url: 'https://example.com/stream' }, sender)
      await flushAsync()

      const dataEvents = sent.filter(([ch]) => ch === 'customFetch:data')
      expect(dataEvents).toHaveLength(2)
      expect(new TextDecoder().decode((dataEvents[0]![1]! as { streamId: string; chunk: ArrayBuffer }).chunk)).toBe(
        'chunk-one',
      )
      expect(new TextDecoder().decode((dataEvents[1]![1]! as { streamId: string; chunk: ArrayBuffer }).chunk)).toBe(
        'chunk-two',
      )

      const endEvent = sent.find(([ch]) => ch === 'customFetch:end')
      expect((endEvent![1] as { streamId: string }).streamId).toBe(result.streamId)
    })

    it('is case-insensitive for the Transfer-Encoding header value', async () => {
      const { mock: sender } = createMockSender()
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'transfer-encoding': 'Chunked' },
          chunks: [],
        }) as never,
      )

      const result = await handleCustomFetch({ url: 'https://example.com/stream' }, sender)

      expect(result.streamId).toBeDefined()
    })

    it('does not stream for transfer-encoding values other than chunked', async () => {
      const { mock: sender } = createMockSender()
      const body = new TextEncoder().encode('hello').buffer as ArrayBuffer
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'transfer-encoding': 'identity' },
          body,
        }) as never,
      )

      const result = await handleCustomFetch({ url: 'https://example.com/api' }, sender)

      expect(result.streamId).toBeUndefined()
      expect(result.body).not.toBeNull()
    })

    it('streams when both SSE content-type and chunked transfer-encoding are present', async () => {
      const { mock: sender } = createMockSender()
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: {
            'content-type': 'text/event-stream',
            'transfer-encoding': 'chunked',
          },
          chunks: [new TextEncoder().encode('data: hi\n\n')],
        }) as never,
      )

      const result = await handleCustomFetch({ url: 'https://example.com/events' }, sender)

      expect(result.streamId).toBeDefined()
    })

    // --- video/* and audio/* ---

    it.each([
      ['video/mp4', 'video stream'],
      ['video/webm', 'video stream'],
      ['audio/mpeg', 'audio stream'],
      ['audio/ogg', 'audio stream'],
    ])('streams %s responses (%s)', async (contentType) => {
      const { mock: sender } = createMockSender()
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'content-type': contentType },
          chunks: [new Uint8Array([0xff, 0xd8, 0xff])], // binary sentinel
        }) as never,
      )

      const result = await handleCustomFetch({ url: 'https://example.com/media' }, sender)

      expect(result.streamId).toBeDefined()
      expect(result.body).toBeNull()
    })

    it('delivers binary chunks for a video/mp4 response', async () => {
      const { mock: sender, sent } = createMockSender()
      const frame1 = new Uint8Array([0x00, 0x01, 0x02])
      const frame2 = new Uint8Array([0x03, 0x04, 0x05])

      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'content-type': 'video/mp4' },
          chunks: [frame1, frame2],
        }) as never,
      )

      await handleCustomFetch({ url: 'https://example.com/clip.mp4' }, sender)
      await flushAsync()

      const dataEvents = sent.filter(([ch]) => ch === 'customFetch:data')
      expect(dataEvents).toHaveLength(2)
      expect(new Uint8Array((dataEvents[0]![1]! as { chunk: ArrayBuffer }).chunk)).toEqual(frame1)
      expect(new Uint8Array((dataEvents[1]![1]! as { chunk: ArrayBuffer }).chunk)).toEqual(frame2)
    })

    it('does not stream application/octet-stream (buffered download)', async () => {
      const { mock: sender } = createMockSender()
      const body = new Uint8Array([1, 2, 3]).buffer as ArrayBuffer
      mockRequest.mockResolvedValue(
        createMockUndiciResponse({
          headers: { 'content-type': 'application/octet-stream' },
          body,
        }) as never,
      )

      const result = await handleCustomFetch({ url: 'https://example.com/file.bin' }, sender)

      expect(result.streamId).toBeUndefined()
      expect(result.body).not.toBeNull()
    })
  })
})
