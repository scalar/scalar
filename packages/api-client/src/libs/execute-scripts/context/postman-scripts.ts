import type { TestResult } from '../execute-post-response-script'

export interface ResponseUtils {
  json: () => Promise<any>
  text: () => Promise<string>
  code: number
  headers: Record<string, string>
  to: ResponseAssertions
}

export interface ResponseAssertions {
  have: {
    status: (expectedStatus: number) => boolean
    header: (headerName: string) => HeaderAssertions
  }
  be: {
    json: () => Promise<boolean>
  }
}

export interface HeaderAssertions {
  that: {
    equals: (expectedValue: string) => boolean
    includes: (expectedValue: string) => boolean
  }
}

export interface EnvironmentUtils {
  get: (key: string) => string | undefined
  set: () => boolean
}

export interface PostmanContext {
  response: ResponseUtils
  environment: EnvironmentUtils
  test: (name: string, fn: () => void | Promise<void>) => Promise<void>
}

export const createResponseUtils = (response: Response): ResponseUtils => ({
  json: async () => {
    const text = await response.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new Error('Response is not valid JSON')
    }
  },
  text: async () => response.text(),
  code: response.status,
  headers: Object.fromEntries(response.headers.entries()),
  to: createResponseAssertions(response),
})

export const createResponseAssertions = (response: Response): ResponseAssertions => ({
  have: {
    status: (expectedStatus: number) => {
      if (response.status !== expectedStatus) {
        throw new Error(`Expected status ${expectedStatus} but got ${response.status}`)
      }
      return true
    },
    header: (headerName: string) => ({
      that: {
        equals: (expectedValue: string) => {
          const actualValue = response.headers.get(headerName)
          if (actualValue !== expectedValue) {
            throw new Error(`Expected header "${headerName}" to be "${expectedValue}" but got "${actualValue}"`)
          }
          return true
        },
        includes: (expectedValue: string) => {
          const actualValue = response.headers.get(headerName)
          if (!actualValue?.includes(expectedValue)) {
            throw new Error(`Expected header "${headerName}" to include "${expectedValue}" but got "${actualValue}"`)
          }
          return true
        },
      },
    }),
  },
  be: {
    json: async () => {
      try {
        await response.json()
        return true
      } catch {
        throw new Error('Expected response to be valid JSON')
      }
    },
  },
})

export const createEnvironmentUtils = (env: Record<string, any> = {}): EnvironmentUtils => ({
  get: (key: string) => env[key],
  set: () => false,
})

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

const updateTestResult = (testResults: TestResult[], name: string, result: TestResult) => {
  const index = testResults.findIndex((t) => t.title === name)
  if (index !== -1) {
    testResults[index] = result
  }
}
