import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TestResult } from '../../index'
import { createTestUtils } from './create-test-utils'

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
