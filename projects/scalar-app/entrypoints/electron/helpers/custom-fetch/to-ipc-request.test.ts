import { beforeEach, describe, expect, it, vi } from 'vitest'

import { toIpcRequest } from './to-ipc-request'

// `toIpcRequest` calls `window.api.customFetchAbort` when the provided
// AbortSignal fires. We install a minimal mock here so tests that exercise the
// abort pathway do not depend on the full Electron preload bridge.
beforeEach(() => {
  ;(globalThis as Record<string, unknown>).window = {
    api: {
      customFetchAbort: vi.fn(),
    },
  }
})

describe('to-ipc-request', () => {
  describe('URL input types', () => {
    it('accepts a plain string URL', async () => {
      const request = await toIpcRequest('https://example.com/api')
      expect(request.url).toBe('https://example.com/api')
    })

    it('accepts a URL object', async () => {
      const url = new URL('https://example.com/api')
      const request = await toIpcRequest(url)
      expect(request.url).toBe('https://example.com/api')
    })

    it('accepts a Request object and extracts url as a string', async () => {
      const input = new Request('https://example.com/api')
      const request = await toIpcRequest(input)
      expect(request.url).toBe('https://example.com/api')
    })

    it('passes query string through unmodified', async () => {
      const request = await toIpcRequest('https://example.com/api?foo=bar&baz=qux')
      expect(request.url).toBe('https://example.com/api?foo=bar&baz=qux')
    })
  })

  describe('request body handling', () => {
    it('sends no body when init.body is null', async () => {
      const request = await toIpcRequest('https://example.com', {
        method: 'POST',
        body: null,
      })
      expect(request.body).toBeUndefined()
    })

    it('sends no body when no init is provided', async () => {
      const request = await toIpcRequest('https://example.com')
      expect(request.body).toBeUndefined()
    })

    it('passes an ArrayBuffer body through without re-wrapping', async () => {
      const buffer = new Uint8Array([1, 2, 3]).buffer as ArrayBuffer
      const request = await toIpcRequest('https://example.com', {
        method: 'POST',
        body: buffer,
      })
      expect(request.body).toBe(buffer)
    })

    it('converts a string body to ArrayBuffer with the correct content', async () => {
      const request = await toIpcRequest('https://example.com', {
        method: 'POST',
        body: '{"key":"value"}',
      })
      expect(request.body).toBeInstanceOf(ArrayBuffer)
      expect(new TextDecoder().decode(request.body)).toBe('{"key":"value"}')
    })

    it('converts a Blob body to ArrayBuffer', async () => {
      const blob = new Blob(['hello blob'], { type: 'text/plain' })
      const request = await toIpcRequest('https://example.com', {
        method: 'POST',
        body: blob,
      })
      expect(request.body).toBeInstanceOf(ArrayBuffer)
    })

    it('converts URLSearchParams body to ArrayBuffer with correct encoding', async () => {
      const params = new URLSearchParams({ foo: 'bar', baz: 'qux' })
      const request = await toIpcRequest('https://example.com', {
        method: 'POST',
        body: params,
      })
      expect(request.body).toBeInstanceOf(ArrayBuffer)
      expect(new TextDecoder().decode(request.body)).toBe('foo=bar&baz=qux')
    })

    it('converts a Uint8Array (ArrayBufferView) body to ArrayBuffer', async () => {
      const view = new Uint8Array([10, 20, 30])
      const request = await toIpcRequest('https://example.com', {
        method: 'POST',
        body: view,
      })
      expect(request.body).toBeInstanceOf(ArrayBuffer)
      expect(new Uint8Array(request.body!)).toEqual(view)
    })

    it('sends body from a Request object when init has no body', async () => {
      const input = new Request('https://example.com', {
        method: 'POST',
        body: 'from-request',
      })
      const request = await toIpcRequest(input)
      expect(request.body).toBeInstanceOf(ArrayBuffer)
      expect(new TextDecoder().decode(request.body)).toBe('from-request')
    })

    it('init.body overrides the Request object body', async () => {
      const input = new Request('https://example.com', {
        method: 'POST',
        body: 'original',
      })
      const request = await toIpcRequest(input, {
        method: 'POST',
        body: 'override',
      })
      expect(new TextDecoder().decode(request.body)).toBe('override')
    })

    it('treats an empty string body as falsy and sends no body', async () => {
      const request = await toIpcRequest('https://example.com', {
        method: 'POST',
        body: '',
      })
      expect(request.body).toBeUndefined()
    })

    it('when init.body is null and Request has a body, Request body is used (null fallthrough)', async () => {
      const input = new Request('https://example.com', {
        method: 'POST',
        body: 'from-request',
      })
      const request = await toIpcRequest(input, { method: 'POST', body: null })
      expect(request.body).toBeInstanceOf(ArrayBuffer)
    })

    it('passes a large binary body without corruption', async () => {
      const size = 1024 * 1024
      const bytes = new Uint8Array(size)
      for (let i = 0; i < size; i++) {
        bytes[i] = i % 256
      }
      const buffer = bytes.buffer as ArrayBuffer

      const request = await toIpcRequest('https://example.com', {
        method: 'POST',
        body: buffer,
      })
      expect(new Uint8Array(request.body!)).toEqual(bytes)
    })
  })

  describe('Request object field extraction', () => {
    it('extracts method from a Request object', async () => {
      const input = new Request('https://example.com', { method: 'DELETE' })
      const request = await toIpcRequest(input)
      expect(request.method).toBe('DELETE')
    })

    it('extracts headers from a Request object as a plain object', async () => {
      const input = new Request('https://example.com', {
        headers: { 'x-custom': 'value', authorization: 'Bearer token' },
      })
      const request = await toIpcRequest(input)
      expect(request.headers?.['x-custom']).toBe('value')
      expect(request.headers?.['authorization']).toBe('Bearer token')
    })

    it('extracts cache from a Request object', async () => {
      const input = new Request('https://example.com', { cache: 'no-cache' })
      const request = await toIpcRequest(input)
      expect(request.cache).toBe('no-cache')
    })

    it('extracts credentials from a Request object', async () => {
      const input = new Request('https://example.com', {
        credentials: 'include',
      })
      const request = await toIpcRequest(input)
      expect(request.credentials).toBe('include')
    })

    it('extracts mode from a Request object', async () => {
      const input = new Request('https://example.com', { mode: 'cors' })
      const request = await toIpcRequest(input)
      expect(request.mode).toBe('cors')
    })

    it('extracts redirect from a Request object', async () => {
      const input = new Request('https://example.com', { redirect: 'manual' })
      const request = await toIpcRequest(input)
      expect(request.redirect).toBe('manual')
    })

    it('extracts referrer from a Request object', async () => {
      const input = new Request('https://example.com', {
        referrer: 'https://referrer.com',
      })
      const request = await toIpcRequest(input)
      expect(request.referrer).toMatch(/^https:\/\/referrer\.com\/?$/)
    })

    it('extracts referrerPolicy from a Request object', async () => {
      const input = new Request('https://example.com', {
        referrerPolicy: 'strict-origin-when-cross-origin',
      })
      const request = await toIpcRequest(input)
      expect(request.referrerPolicy).toBe('strict-origin-when-cross-origin')
    })
  })

  describe('init overrides for Request object', () => {
    it('init.method overrides Request method', async () => {
      const input = new Request('https://example.com', { method: 'DELETE' })
      const request = await toIpcRequest(input, { method: 'PATCH' })
      expect(request.method).toBe('PATCH')
    })

    it('init.headers replaces Request headers entirely (no merge)', async () => {
      const input = new Request('https://example.com', {
        headers: { 'x-from-request': 'should-be-gone' },
      })
      const request = await toIpcRequest(input, {
        headers: { 'x-from-init': 'present' },
      })
      expect(request.headers?.['x-from-init']).toBe('present')
      expect(request.headers?.['x-from-request']).toBeUndefined()
    })
  })

  describe('header transforms integration', () => {
    it('promotes x-scalar-cookie to Cookie and removes the original header', async () => {
      const request = await toIpcRequest('https://example.com', {
        headers: { 'x-scalar-cookie': 'session=abc' },
      })
      expect(request.headers?.['cookie']).toBe('session=abc')
      expect(request.headers?.['x-scalar-cookie']).toBeUndefined()
    })

    it('promotes x-scalar-user-agent to User-Agent and removes the original header', async () => {
      const request = await toIpcRequest('https://example.com', {
        headers: { 'x-scalar-user-agent': 'MyApp/1.0' },
      })
      expect(request.headers?.['user-agent']).toBe('MyApp/1.0')
      expect(request.headers?.['x-scalar-user-agent']).toBeUndefined()
    })

    it('leaves unrelated headers unchanged', async () => {
      const request = await toIpcRequest('https://example.com', {
        headers: { authorization: 'Bearer token', 'x-custom': 'value' },
      })
      expect(request.headers?.['authorization']).toBe('Bearer token')
      expect(request.headers?.['x-custom']).toBe('value')
    })

    it('applies transforms when input is a Request object', async () => {
      const input = new Request('https://example.com', {
        headers: {
          'x-scalar-cookie': 'sid=xyz',
          'x-scalar-user-agent': 'RequestObj/2.0',
        },
      })
      const request = await toIpcRequest(input)
      expect(request.headers?.['cookie']).toBe('sid=xyz')
      expect(request.headers?.['user-agent']).toBe('RequestObj/2.0')
      expect(request.headers?.['x-scalar-cookie']).toBeUndefined()
      expect(request.headers?.['x-scalar-user-agent']).toBeUndefined()
    })

    it('init.headers override Request headers and transforms are applied to the result', async () => {
      const input = new Request('https://example.com', {
        headers: { 'x-scalar-cookie': 'from-request' },
      })
      const request = await toIpcRequest(input, {
        headers: { 'x-scalar-cookie': 'from-init' },
      })
      expect(request.headers?.['cookie']).toBe('from-init')
      expect(request.headers?.['x-scalar-cookie']).toBeUndefined()
    })
  })

  describe('abort signal handling', () => {
    it('includes an abortId when an AbortSignal is provided via init', async () => {
      const controller = new AbortController()
      const request = await toIpcRequest('https://example.com', {
        signal: controller.signal,
      })
      expect(request.abortId).toBeDefined()
      expect(typeof request.abortId).toBe('string')
    })

    it('does not include an abortId when no signal is provided', async () => {
      const request = await toIpcRequest('https://example.com')
      expect(request.abortId).toBeUndefined()
    })

    it('reads the signal from a Request object when no init signal is provided', async () => {
      const controller = new AbortController()
      const input = new Request('https://example.com', {
        signal: controller.signal,
      })
      const request = await toIpcRequest(input)
      expect(request.abortId).toBeDefined()
    })

    it('calls window.api.customFetchAbort with the abortId when the signal fires', async () => {
      const abortMock = vi.fn()
      ;(globalThis as Record<string, unknown>).window = {
        api: { customFetchAbort: abortMock },
      }

      const controller = new AbortController()
      const request = await toIpcRequest('https://example.com', {
        signal: controller.signal,
      })

      controller.abort()
      expect(abortMock).toHaveBeenCalledWith(request.abortId)
    })

    it('fires customFetchAbort only once even if abort fires multiple times', async () => {
      const abortMock = vi.fn()
      ;(globalThis as Record<string, unknown>).window = {
        api: { customFetchAbort: abortMock },
      }

      const controller = new AbortController()
      await toIpcRequest('https://example.com', {
        signal: controller.signal,
      })

      controller.abort()
      // Second call is a no-op on AbortController; the once:true listener
      // ensures customFetchAbort fires exactly once regardless.
      controller.abort()
      expect(abortMock).toHaveBeenCalledTimes(1)
    })
  })
})
