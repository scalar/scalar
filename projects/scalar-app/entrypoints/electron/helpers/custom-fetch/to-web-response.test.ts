import { describe, expect, it } from 'vitest'

import { toWebResponse } from './to-web-response'
import type { TransportResponse } from './types'

type MockOptions = {
  status?: number
  statusText?: string
  headers?: [string, string][]
  body?: ArrayBuffer | null | ReadableStream<Uint8Array>
  url?: string
  redirected?: boolean
}

function createMockTransportResponse({
  status = 200,
  statusText = 'OK',
  headers = [],
  body = new ArrayBuffer(0),
  url = 'https://example.com',
  redirected = false,
}: MockOptions = {}): TransportResponse {
  return { status, statusText, headers, body, url, redirected }
}

describe('to-web-response', () => {
  describe('basic response shape', () => {
    it('returns a DOM Response instance', () => {
      const result = toWebResponse(createMockTransportResponse())
      expect(result).toBeInstanceOf(Response)
    })

    it('preserves status code', () => {
      const result = toWebResponse(createMockTransportResponse({ status: 404 }))
      expect(result.status).toBe(404)
    })

    it('preserves status text', () => {
      const result = toWebResponse(createMockTransportResponse({ statusText: 'Not Found' }))
      expect(result.statusText).toBe('Not Found')
    })

    it('result.ok is true for 2xx', () => {
      const result = toWebResponse(createMockTransportResponse({ status: 201 }))
      expect(result.ok).toBe(true)
    })

    it('result.ok is false for 4xx / 5xx', () => {
      const result = toWebResponse(
        createMockTransportResponse({
          status: 500,
          statusText: 'Internal Server Error',
        }),
      )
      expect(result.ok).toBe(false)
      expect(result.status).toBe(500)
    })
  })

  describe('headers', () => {
    it('preserves a single response header', () => {
      const result = toWebResponse(
        createMockTransportResponse({
          headers: [['content-type', 'application/json']],
        }),
      )
      expect(result.headers.get('content-type')).toBe('application/json')
    })

    it('preserves multiple distinct response headers', () => {
      const result = toWebResponse(
        createMockTransportResponse({
          headers: [
            ['content-type', 'application/json'],
            ['x-rate-limit', '100'],
          ],
        }),
      )
      expect(result.headers.get('content-type')).toBe('application/json')
      expect(result.headers.get('x-rate-limit')).toBe('100')
    })

    it('appends multiple values for the same header key (e.g. Set-Cookie)', () => {
      const result = toWebResponse(
        createMockTransportResponse({
          headers: [
            ['set-cookie', 'a=1; Path=/'],
            ['set-cookie', 'b=2; Path=/'],
          ],
        }),
      )
      const combined = result.headers.get('set-cookie')
      expect(combined).toContain('a=1')
      expect(combined).toContain('b=2')
    })

    it('handles a response with no headers at all', () => {
      const result = toWebResponse(createMockTransportResponse({ headers: [] }))
      expect(result.status).toBe(200)
      expect(result.headers.get('content-type')).toBeNull()
    })

    it('handles a response with many headers', () => {
      const manyHeaders = Array.from({ length: 50 }, (_, i): [string, string] => [`x-header-${i}`, `value-${i}`])
      const result = toWebResponse(createMockTransportResponse({ headers: manyHeaders }))
      expect(result.headers.get('x-header-0')).toBe('value-0')
      expect(result.headers.get('x-header-49')).toBe('value-49')
    })
  })

  describe('body handling', () => {
    it('preserves a text response body', async () => {
      const buffer = new TextEncoder().encode('hello world').buffer as ArrayBuffer
      const result = toWebResponse(createMockTransportResponse({ body: buffer }))
      expect(await result.text()).toBe('hello world')
    })

    it('preserves a binary response body', async () => {
      const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
      const buffer = bytes.buffer as ArrayBuffer
      const result = toWebResponse(createMockTransportResponse({ body: buffer }))
      expect(new Uint8Array(await result.arrayBuffer())).toEqual(bytes)
    })

    it('handles an empty response body', async () => {
      const result = toWebResponse(createMockTransportResponse({ body: new ArrayBuffer(0) }))
      expect(await result.text()).toBe('')
    })
  })

  describe('url and redirected proxy passthrough', () => {
    it('response.url reflects the url returned by the transport', () => {
      const result = toWebResponse(
        createMockTransportResponse({
          url: 'https://api.example.com/pets?limit=10',
        }),
      )
      expect(result.url).toBe('https://api.example.com/pets?limit=10')
    })

    it('new URL(response.url) does not throw', () => {
      const result = toWebResponse(createMockTransportResponse({ url: 'https://api.example.com/pets' }))
      expect(() => new URL(result.url)).not.toThrow()
    })

    it('response.redirected reflects the value returned by the transport', () => {
      const result = toWebResponse(createMockTransportResponse({ redirected: true }))
      expect(result.redirected).toBe(true)
    })
  })

  describe('null-body status codes (204, 205, 304)', () => {
    // Per the Fetch spec, constructing a Response with a non-null body for a
    // null-body status (204, 205, 304) throws a TypeError.  toWebResponse must
    // pass null as the body for these statuses regardless of what the transport
    // returns.

    it('204 response has the correct status code', () => {
      const result = toWebResponse(
        createMockTransportResponse({
          status: 204,
          statusText: 'No Content',
          body: null,
        }),
      )
      expect(result.status).toBe(204)
    })

    it('204 response has a null body', () => {
      const result = toWebResponse(
        createMockTransportResponse({
          status: 204,
          statusText: 'No Content',
          body: null,
        }),
      )
      expect(result.body).toBeNull()
    })

    it('205 response has a null body', () => {
      const result = toWebResponse(
        createMockTransportResponse({
          status: 205,
          statusText: 'Reset Content',
          body: null,
        }),
      )
      expect(result.body).toBeNull()
    })

    it('304 response has a null body', () => {
      const result = toWebResponse(
        createMockTransportResponse({
          status: 304,
          statusText: 'Not Modified',
          body: null,
        }),
      )
      expect(result.body).toBeNull()
    })

    it('discards a non-null body sent by the transport for a 204 (defensive guard)', () => {
      // Transport should not send a body for null-body statuses, but toWebResponse
      // must be robust against it to avoid a TypeError from the Response constructor.
      const result = toWebResponse(createMockTransportResponse({ status: 204, body: new ArrayBuffer(4) }))
      expect(result.body).toBeNull()
    })

    it('200 response body is still accessible after the null-body fix (regression)', async () => {
      const buffer = new TextEncoder().encode('hello').buffer as ArrayBuffer
      const result = toWebResponse(createMockTransportResponse({ status: 200, body: buffer }))
      expect(await result.text()).toBe('hello')
    })
  })

  describe('streaming / SSE responses', () => {
    // The transport can return a ReadableStream body (e.g. from a streaming IPC
    // channel or a local/test transport).  toWebResponse must pass it through
    // unchanged so callers can consume the response body incrementally.

    it('passes a ReadableStream body through to the Response', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode('data: hello\n\n'))
          controller.enqueue(encoder.encode('data: world\n\n'))
          controller.close()
        },
      })

      const result = toWebResponse(
        createMockTransportResponse({
          status: 200,
          headers: [['content-type', 'text/event-stream']],
          body: stream,
        }),
      )
      expect(result.headers.get('content-type')).toBe('text/event-stream')
      expect(result.body).not.toBeNull()

      const reader = result.body!.getReader()
      const chunks: string[] = []
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        chunks.push(new TextDecoder().decode(value))
      }
      expect(chunks.join('')).toContain('data: hello')
      expect(chunks.join('')).toContain('data: world')
    })

    it('delivers chunks in order for an SSE stream', async () => {
      const encoder = new TextEncoder()
      const lines = ['data: 1\n\n', 'data: 2\n\n', 'data: 3\n\n']
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          for (const line of lines) {
            controller.enqueue(encoder.encode(line))
          }
          controller.close()
        },
      })

      const result = toWebResponse(
        createMockTransportResponse({
          headers: [['content-type', 'text/event-stream']],
          body: stream,
        }),
      )
      const reader = result.body!.getReader()
      const received: string[] = []
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        received.push(new TextDecoder().decode(value))
      }
      expect(received).toEqual(lines)
    })

    it('does not consume the stream body before the caller reads it', () => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('chunk'))
          controller.close()
        },
      })

      const result = toWebResponse(
        createMockTransportResponse({
          headers: [['content-type', 'text/event-stream']],
          body: stream,
        }),
      )
      // bodyUsed must be false — toWebResponse must not read from the stream
      expect(result.bodyUsed).toBe(false)
    })

    it('supports incremental chunk delivery (simulates live SSE)', async () => {
      const encoder = new TextEncoder()
      let ctrl!: ReadableStreamDefaultController<Uint8Array>
      const stream = new ReadableStream<Uint8Array>({
        start(c) {
          ctrl = c
        },
      })

      const result = toWebResponse(
        createMockTransportResponse({
          headers: [['content-type', 'text/event-stream']],
          body: stream,
        }),
      )
      const reader = result.body!.getReader()

      // Enqueue chunks after the Response has been constructed
      ctrl.enqueue(encoder.encode('data: first\n\n'))
      const { value: chunk1 } = await reader.read()
      expect(new TextDecoder().decode(chunk1)).toBe('data: first\n\n')

      ctrl.enqueue(encoder.encode('data: second\n\n'))
      const { value: chunk2 } = await reader.read()
      expect(new TextDecoder().decode(chunk2)).toBe('data: second\n\n')

      ctrl.close()
      const { done } = await reader.read()
      expect(done).toBe(true)
    })
  })
})
