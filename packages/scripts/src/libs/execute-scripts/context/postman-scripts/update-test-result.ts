import type { TestResult } from '../../index'

export const updateTestResult = (testResults: TestResult[], name: string, result: TestResult) => {
  const index = testResults.findIndex((t) => t.title === name)
  if (index !== -1) {
    testResults[index] = result
  }
}
