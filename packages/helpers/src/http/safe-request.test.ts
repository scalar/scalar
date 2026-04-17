import { describe, expect, it } from 'vitest'

import { X_SCALAR_ORIGINAL_METHOD, createSafeRequest, getOriginalMethod } from './safe-request'

describe('safe-request', () => {
  describe('createSafeRequest', () => {
    it('builds a normal GET request when no body is provided', () => {
      const request = createSafeRequest('https://example.com', { method: 'GET' })

      expect(request.method).toBe('GET')
      expect(request.headers.has(X_SCALAR_ORIGINAL_METHOD)).toBe(false)
    })

    it('uppercases the method even when no rewrite is needed', () => {
      const request = createSafeRequest('https://example.com', { method: 'patch', body: '{}' })

      expect(request.method).toBe('PATCH')
      expect(request.headers.has(X_SCALAR_ORIGINAL_METHOD)).toBe(false)
    })

    it.each(['GET', 'HEAD', 'get', 'head'] as const)(
      'rewrites %s with body to POST + sentinel header',
      async (method) => {
        const request = createSafeRequest('https://example.com', {
          method,
          body: 'payload',
        })

        expect(request.method).toBe('POST')
        expect(request.headers.get(X_SCALAR_ORIGINAL_METHOD)).toBe(method.toUpperCase())
        await expect(request.text()).resolves.toBe('payload')
      },
    )

    it('preserves caller-provided headers when rewriting', () => {
      const request = createSafeRequest('https://example.com', {
        method: 'GET',
        body: '{}',
        headers: { 'content-type': 'application/json' },
      })

      expect(request.headers.get('content-type')).toBe('application/json')
      expect(request.headers.get(X_SCALAR_ORIGINAL_METHOD)).toBe('GET')
    })

    it('keeps POST/PUT/PATCH/DELETE bodies untouched', async () => {
      const request = createSafeRequest('https://example.com', { method: 'POST', body: 'payload' })

      expect(request.method).toBe('POST')
      expect(request.headers.has(X_SCALAR_ORIGINAL_METHOD)).toBe(false)
      await expect(request.text()).resolves.toBe('payload')
    })

    it('does not rewrite GET when body is null', () => {
      const request = createSafeRequest('https://example.com', { method: 'GET', body: null })

      expect(request.method).toBe('GET')
      expect(request.headers.has(X_SCALAR_ORIGINAL_METHOD)).toBe(false)
    })

    it('defaults to GET when no method is provided', () => {
      const request = createSafeRequest('https://example.com')

      expect(request.method).toBe('GET')
    })
  })

  describe('getOriginalMethod', () => {
    it('returns the request method when no sentinel header is set', () => {
      const request = new Request('https://example.com', { method: 'POST', body: '{}' })

      expect(getOriginalMethod(request)).toBe('post')
    })

    it('returns the sentinel value when present', () => {
      const request = createSafeRequest('https://example.com', { method: 'GET', body: '{}' })

      expect(getOriginalMethod(request)).toBe('get')
    })

    it('lowercases the resolved method', () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        body: '{}',
        headers: { [X_SCALAR_ORIGINAL_METHOD]: 'HEAD' },
      })

      expect(getOriginalMethod(request)).toBe('head')
    })
  })
})
