import type { TestResult } from '../../index'
import { updateTestResult } from './update-test-result'

export const createTestUtils = (testResults: TestResult[], onTestResultsUpdate?: (results: TestResult[]) => void) => ({
  test: async (name: string, fn: () => void | Promise<void>) => {
    const testStartTime = performance.now()
    const pendingResult: TestResult = {
      title: name,
      passed: false,
      duration: Number((performance.now() - testStartTime).toFixed(2)),
      status: 'pending',
    }
    testResults.push(pendingResult)
    onTestResultsUpdate?.(testResults)

    try {
      await Promise.resolve(fn())
      const testEndTime = performance.now()
      const duration = Number((testEndTime - testStartTime).toFixed(2))
      const result: TestResult = {
        title: name,
        passed: true,
        duration,
        status: 'passed',
      }
      updateTestResult(testResults, name, result)
      onTestResultsUpdate?.(testResults)
      console.log(`✓ ${name}`)
    } catch (error: unknown) {
      const testEndTime = performance.now()
      const duration = Number((testEndTime - testStartTime).toFixed(2))
      const errorMessage = error instanceof Error ? error.message : String(error)
      const result: TestResult = {
        title: name,
        passed: false,
        duration,
        error: errorMessage,
        status: 'failed',
      }
      updateTestResult(testResults, name, result)
      onTestResultsUpdate?.(testResults)
      console.error(`✗ ${name}: ${errorMessage}`)
    }
  },
})
