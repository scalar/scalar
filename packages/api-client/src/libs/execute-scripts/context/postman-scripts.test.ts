import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TestResult } from '../execute-post-response-script'
import {
  createEnvironmentUtils,
  createExpectChain,
  createResponseAssertions,
  createResponseUtils,
  createTestUtils,
} from './postman-scripts'

describe('postman-scripts', () => {
  describe('createResponseUtils', () => {
    let mockResponse: Response
    let responseText: string

    beforeEach(() => {
      responseText = JSON.stringify({ data: 'test' })
      mockResponse = new Response(responseText, {
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
      })

      // Override the text() and json() methods to be synchronous
      mockResponse.text = () => Promise.resolve(responseText)
      mockResponse.json = () => Promise.resolve(JSON.parse(responseText))
    })

    it('parses JSON response correctly', async () => {
      const utils = createResponseUtils(mockResponse)
      // Wait for the text promise to resolve
      await utils.text()
      const result = utils.json()
      expect(result).toEqual({ data: 'test' })
    })

    it('throws error for invalid JSON', async () => {
      const invalidResponse = new Response('invalid json')
      invalidResponse.text = () => Promise.resolve('invalid json')
      invalidResponse.json = () => Promise.reject(new Error('Response is not valid JSON'))

      const utils = createResponseUtils(invalidResponse)
      // Wait for the text promise to resolve
      await utils.text()
      expect(() => utils.json()).toThrow('Response is not valid JSON')
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

  describe('createExpectChain', () => {
    describe('to.be.below', () => {
      it('passes when number is below expected', () => {
        const chain = createExpectChain(5)
        expect(chain.to.be.below(10)).toBe(true)
      })

      it('throws when number is equal to expected', () => {
        const chain = createExpectChain(10)
        expect(() => chain.to.be.below(10)).toThrow('Expected 10 to be below 10')
      })

      it('throws when number is greater than expected', () => {
        const chain = createExpectChain(15)
        expect(() => chain.to.be.below(10)).toThrow('Expected 15 to be below 10')
      })

      it('throws when value is not a number', () => {
        const chain = createExpectChain('not a number')
        expect(() => chain.to.be.below(10)).toThrow('Expected value to be a number')
      })
    })

    describe('to.be.an', () => {
      it('correctly identifies arrays', () => {
        const chain = createExpectChain([1, 2, 3])
        expect(chain.to.be.an('array')).toBe(true)
      })

      it('throws when type does not match', () => {
        const chain = createExpectChain('string')
        expect(() => chain.to.be.an('array')).toThrow('Expected "string" to be an array, but got string')
      })
    })

    describe('to.be.oneOf', () => {
      it('passes when value is in expected array', () => {
        const chain = createExpectChain('apple')
        expect(chain.to.be.oneOf(['apple', 'banana', 'orange'])).toBe(true)
      })

      it('throws when value is not in expected array', () => {
        const chain = createExpectChain('grape')
        expect(() => chain.to.be.oneOf(['apple', 'banana', 'orange'])).toThrow(
          'Expected "grape" to be one of ["apple","banana","orange"]',
        )
      })

      it('throws when expected is not an array', () => {
        const chain = createExpectChain('apple')
        expect(() => chain.to.be.oneOf('not an array' as any)).toThrow('Expected argument to be an array')
      })
    })

    describe('to.include', () => {
      it('passes when string includes expected substring', () => {
        const chain = createExpectChain('hello world')
        expect(chain.to.include('world')).toBe(true)
      })

      it('throws when string does not include expected substring', () => {
        const chain = createExpectChain('hello world')
        expect(() => chain.to.include('goodbye')).toThrow('Expected "hello world" to include "goodbye"')
      })

      it('throws when value is not a string', () => {
        const chain = createExpectChain(123)
        expect(() => chain.to.include('23')).toThrow('Expected value to be a string')
      })
    })

    it('throws when trying to expect a Promise', () => {
      expect(() => createExpectChain(Promise.resolve())).toThrow(
        'Expected value cannot be a Promise. Make sure to await async values before using expect.',
      )
    })
  })
})
