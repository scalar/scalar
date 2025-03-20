import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TestResult } from '../execute-post-response-script'
import {
  createEnvironmentUtils,
  createResponseAssertions,
  createResponseUtils,
  createTestUtils,
} from './postman-scripts'

describe('postman-scripts', () => {
  describe('createResponseUtils', () => {
    let mockResponse: Response

    beforeEach(() => {
      mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
      })
    })

    it('parses JSON response correctly', async () => {
      const utils = createResponseUtils(mockResponse)
      const result = await utils.json()
      expect(result).toEqual({ data: 'test' })
    })

    it('throws error for invalid JSON', async () => {
      const invalidResponse = new Response('invalid json')
      const utils = createResponseUtils(invalidResponse)
      await expect(utils.json()).rejects.toThrow('Response is not valid JSON')
    })

    it('returns response text', async () => {
      const utils = createResponseUtils(mockResponse)
      const result = await utils.text()
      expect(result).toBe('{"data":"test"}')
    })

    it('provides status code', () => {
      const utils = createResponseUtils(mockResponse)
      expect(utils.code).toBe(200)
    })

    it('provides headers as object', () => {
      const utils = createResponseUtils(mockResponse)
      expect(utils.headers['content-type']).toBe('application/json')
    })
  })

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

  describe('createEnvironmentUtils', () => {
    it('returns values from provided environment object', () => {
      const env = {
        FOOBAR: 'test',
        API_URL: 'http://test.com',
        nested: { foo: 'bar' },
      }
      const envUtils = createEnvironmentUtils(env)
      expect(envUtils.get('FOOBAR')).toBe('test')
      expect(envUtils.get('API_URL')).toBe('http://test.com')
      expect(envUtils.get('nested')).toEqual({ foo: 'bar' })
    })

    it('returns undefined for non-existent variables', () => {
      const envUtils = createEnvironmentUtils({})
      expect(envUtils.get('NON_EXISTENT')).toBeUndefined()
    })

    it('set method always returns false', () => {
      const envUtils = createEnvironmentUtils({})
      expect(envUtils.set()).toBe(false)
    })
  })

  describe('createTestUtils', () => {
    let testResults: TestResult[]
    let onTestResultsUpdate: (results: TestResult[]) => void

    beforeEach(() => {
      testResults = []
      onTestResultsUpdate = vi.fn()
    })

    it('handles successful test', async () => {
      const testUtils = createTestUtils(testResults, onTestResultsUpdate)
      await testUtils.test('successful test', () => {
        expect(true).toBe(true)
      })

      expect(testResults[0]).toMatchObject({
        title: 'successful test',
        passed: true,
        status: 'passed',
      })
      expect(onTestResultsUpdate).toHaveBeenCalled()
    })

    it('handles failed test', async () => {
      const testUtils = createTestUtils(testResults, onTestResultsUpdate)
      await testUtils.test('failing test', () => {
        throw new Error('Test failed')
      })

      expect(testResults[0]).toMatchObject({
        title: 'failing test',
        passed: false,
        status: 'failed',
        error: 'Test failed',
      })
      expect(onTestResultsUpdate).toHaveBeenCalled()
    })

    it('handles async test', async () => {
      const testUtils = createTestUtils(testResults, onTestResultsUpdate)
      await testUtils.test('async test', async () => {
        await Promise.resolve()
        expect(true).toBe(true)
      })

      expect(testResults[0]).toMatchObject({
        title: 'async test',
        passed: true,
        status: 'passed',
      })
    })
  })
})
