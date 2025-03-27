import { beforeEach, describe, expect, it } from 'vitest'
import { createResponseAssertions } from './create-response-assertions'

describe('createResponseAssertions', () => {
  let mockResponse: Response

  beforeEach(() => {
    mockResponse = new Response('', {
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
    })
  })

  describe('have.status', () => {
    it('passes when status matches', () => {
      const assertions = createResponseAssertions(mockResponse)
      expect(assertions.have.status(200)).toBe(true)
    })

    it('throws when status does not match', () => {
      const assertions = createResponseAssertions(mockResponse)
      expect(() => assertions.have.status(404)).toThrow('Expected status 404 but got 200')
    })
  })

  describe('have.header', () => {
    it('checks header equality', () => {
      const assertions = createResponseAssertions(mockResponse)
      expect(assertions.have.header('content-type').that.equals('application/json')).toBe(true)
    })

    it('checks header includes', () => {
      const assertions = createResponseAssertions(mockResponse)
      expect(assertions.have.header('content-type').that.includes('json')).toBe(true)
    })

    it('throws when header equality fails', () => {
      const assertions = createResponseAssertions(mockResponse)
      expect(() => assertions.have.header('content-type').that.equals('text/plain')).toThrow(
        'Expected header "content-type" to be "text/plain" but got "application/json"',
      )
    })
  })

  describe('be.json', () => {
    it('validates JSON response', async () => {
      const validJsonResponse = new Response('{"data":"test"}')
      const assertions = createResponseAssertions(validJsonResponse)
      await expect(assertions.be.json()).resolves.toBe(true)
    })

    it('throws for invalid JSON', async () => {
      const invalidJsonResponse = new Response('invalid json')
      const assertions = createResponseAssertions(invalidJsonResponse)
      await expect(assertions.be.json()).rejects.toThrow('Expected response to be valid JSON')
    })
  })
})
