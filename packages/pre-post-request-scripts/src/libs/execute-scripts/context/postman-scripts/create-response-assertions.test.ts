import { mockSynchronousResponse } from '@test/utils/mock-synchronous-response'
import { describe, expect, it } from 'vitest'
import { createResponseAssertions } from './create-response-assertions'

describe('createResponseAssertions', () => {
  describe('have.status', () => {
    it('passes when status matches', async () => {
      const assertions = createResponseAssertions(await mockSynchronousResponse())
      expect(assertions.have.status(200)).toBe(true)
    })

    it('throws when status does not match', async () => {
      const assertions = createResponseAssertions(await mockSynchronousResponse())
      expect(() => assertions.have.status(404)).toThrow('Expected status 404 but got 200')
    })

    it('passes when status text matches', async () => {
      const assertions = createResponseAssertions(await mockSynchronousResponse())
      expect(assertions.have.status('OK')).toBe(true)
    })
  })

  describe('have.header', () => {
    it('checks header equality', async () => {
      const assertions = createResponseAssertions(await mockSynchronousResponse())
      expect(assertions.have.header('content-type').that.equals('application/json')).toBe(true)
    })

    it('checks header includes', async () => {
      const assertions = createResponseAssertions(await mockSynchronousResponse())
      expect(assertions.have.header('content-type').that.includes('json')).toBe(true)
    })

    it('throws when header equality fails', async () => {
      const assertions = createResponseAssertions(await mockSynchronousResponse())
      expect(() => assertions.have.header('content-type').that.equals('text/plain')).toThrow(
        'Expected header "content-type" to be "text/plain" but got "application/json"',
      )
    })
  })

  describe('be.json', () => {
    it('validates JSON response', async () => {
      const validJsonResponse = await mockSynchronousResponse('{"data":"test"}')
      const assertions = createResponseAssertions(validJsonResponse)
      expect(assertions.be.json()).toBe(true)
    })

    it('throws for invalid JSON', async () => {
      const invalidJsonResponse = await mockSynchronousResponse('invalid json')
      const assertions = createResponseAssertions(invalidJsonResponse)
      expect(() => assertions.be.json()).toThrow('Expected response to be valid JSON')
    })
  })

  describe('have.body', () => {
    it('passes when body matches expected string', async () => {
      const response = await mockSynchronousResponse('foobar')
      const assertions = createResponseAssertions(response)
      expect(assertions.have.body('foobar')).toBe(true)
    })

    it('throws when body does not match expected string', async () => {
      const response = await mockSynchronousResponse('actual body')
      const assertions = createResponseAssertions(response)
      expect(() => assertions.have.body('expected body')).toThrow(
        'Expected body to be "expected body" but got "actual body"',
      )
    })
  })
})
