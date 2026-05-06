import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createCustomFetch } from './create-custom-fetch'
import type { IpcFetchRequest, TransportResponse } from './types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MockIpcResponseOptions = {
  status?: number
  statusText?: string
  headers?: [string, string][]
  body?: ArrayBuffer | null | ReadableStream<Uint8Array>
  url?: string
  redirected?: boolean
}

function createMockIpcResponse({
  status = 200,
  statusText = 'OK',
  headers = [],
  body = new ArrayBuffer(0),
  url = 'https://example.com',
  redirected = false,
}: MockIpcResponseOptions = {}): TransportResponse {
  return { status, statusText, headers, body, url, redirected }
}

// ---------------------------------------------------------------------------
// Test setup – fresh transport mock + customFetch instance per test
// ---------------------------------------------------------------------------

let mockTransport: ReturnType<typeof vi.fn<(request: IpcFetchRequest) => Promise<TransportResponse>>>
let customFetch: ReturnType<typeof createCustomFetch>

beforeEach(() => {
  mockTransport = vi.fn<(request: IpcFetchRequest) => Promise<TransportResponse>>()
  mockTransport.mockResolvedValue(createMockIpcResponse())
  customFetch = createCustomFetch(mockTransport)

  // `toIpcRequest` references `window.api.customFetchAbort` when an
  // AbortSignal is present; install a no-op stub so tests that pass a signal
  // do not trip on a missing bridge.
  ;(globalThis as Record<string, unknown>).window = {
    api: { customFetchAbort: vi.fn() },
  }
})

describe('create-custom-fetch', () => {
  describe('wiring', () => {
    it('forwards the flattened request to the transport', async () => {
      await customFetch('https://example.com/api', { method: 'POST' })
      expect(mockTransport).toHaveBeenCalledTimes(1)
      const sentRequest = mockTransport.mock.calls[0]![0]!
      expect(sentRequest.url).toBe('https://example.com/api')
      expect(sentRequest.method).toBe('POST')
    })

    it('returns a DOM Response built from the transport result', async () => {
      mockTransport.mockResolvedValue(createMockIpcResponse({ status: 418, statusText: "I'm a teapot" }))
      const result = await customFetch('https://example.com')
      expect(result).toBeInstanceOf(Response)
      expect(result.status).toBe(418)
      expect(result.statusText).toBe("I'm a teapot")
    })
  })

  describe('error handling', () => {
    it('propagates network errors thrown by the transport', async () => {
      mockTransport.mockRejectedValue(new TypeError('fetch failed'))
      await expect(customFetch('https://example.com')).rejects.toThrow('fetch failed')
    })

    it('propagates DOMException AbortError', async () => {
      mockTransport.mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'))
      await expect(customFetch('https://example.com')).rejects.toThrow('The operation was aborted.')
    })
  })

  describe('concurrency', () => {
    it('handles concurrent requests independently', async () => {
      const enc = new TextEncoder()
      mockTransport
        .mockResolvedValueOnce(
          createMockIpcResponse({
            body: enc.encode('response-A').buffer as ArrayBuffer,
          }),
        )
        .mockResolvedValueOnce(
          createMockIpcResponse({
            body: enc.encode('response-B').buffer as ArrayBuffer,
          }),
        )

      const [resA, resB] = await Promise.all([
        customFetch('https://example.com/a'),
        customFetch('https://example.com/b'),
      ])

      expect(await resA.text()).toBe('response-A')
      expect(await resB.text()).toBe('response-B')
    })
  })
})
