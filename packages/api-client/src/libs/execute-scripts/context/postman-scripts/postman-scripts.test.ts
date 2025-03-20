import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TestResult } from '../../execute-post-response-script'
import { createEnvironmentUtils } from './create-environment-utils'
import { createTestUtils } from './create-test-utils'

describe('postman-scripts', () => {
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
