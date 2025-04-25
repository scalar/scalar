import { describe, expect, it } from 'vitest'
import { createResponseAssertions } from './create-response-assertions'

const mockResponse = (body?: string) => {
  return new Response(body, {
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'content-type': 'application/json' }),
    // @ts-expect-error
    text: () => body ?? '',
    json: () => JSON.parse(body ?? '{}'),
  }) as unknown as Omit<Response, 'text' | 'json'> & { text: () => string; json: () => any }
}

describe('createResponseAssertions', () => {
  describe('have.status', () => {
    it('passes when status matches', () => {
      const assertions = createResponseAssertions(mockResponse())
      expect(assertions.have.status(200)).toBe(true)
    })

    it('throws when status does not match', () => {
      const assertions = createResponseAssertions(mockResponse())
      expect(() => assertions.have.status(404)).toThrow('Expected status 404 but got 200')
    })

    it('passes when status text matches', () => {
      const assertions = createResponseAssertions(mockResponse())
      expect(assertions.have.status('OK')).toBe(true)
    })
  })

  describe('have.header', () => {
    it('checks header equality', () => {
      const assertions = createResponseAssertions(mockResponse())
      expect(assertions.have.header('content-type').that.equals('application/json')).toBe(true)
    })

    it('checks header includes', () => {
      const assertions = createResponseAssertions(mockResponse())
      expect(assertions.have.header('content-type').that.includes('json')).toBe(true)
    })

    it('throws when header equality fails', () => {
      const assertions = createResponseAssertions(mockResponse())
      expect(() => assertions.have.header('content-type').that.equals('text/plain')).toThrow(
        'Expected header "content-type" to be "text/plain" but got "application/json"',
      )
    })
  })

  describe('be.json', () => {
    it('validates JSON response', () => {
      const validJsonResponse = mockResponse('{"data":"test"}')
      const assertions = createResponseAssertions(validJsonResponse)
      expect(assertions.be.json()).toBe(true)
    })

    it('throws for invalid JSON', () => {
      const invalidJsonResponse = mockResponse('invalid json')
      const assertions = createResponseAssertions(invalidJsonResponse)
      expect(() => assertions.be.json()).toThrow('Expected response to be valid JSON')
    })
  })

  describe('have.body', () => {
    it('passes when body matches expected string', () => {
      const response = mockResponse('foobar')
      const assertions = createResponseAssertions(response)
      expect(assertions.have.body('foobar')).toBe(true)
    })

    it('throws when body does not match expected string', () => {
      const response = mockResponse('actual body')
      const assertions = createResponseAssertions(response)
      expect(() => assertions.have.body('expected body')).toThrow(
        'Expected body to be "expected body" but got "actual body"',
      )
    })
  })
})
