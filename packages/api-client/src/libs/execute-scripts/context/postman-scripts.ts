import type { TestResult } from '../execute-post-response-script'

export interface ResponseUtils {
  json: () => any
  text: () => Promise<string>
  code: number
  headers: Record<string, string>
  to: ResponseAssertions
  responseTime: number
}

export interface ResponseAssertions {
  have: {
    status: (expectedStatus: number) => boolean
    header: (headerName: string) => HeaderAssertions
    jsonSchema: (schema: object) => Promise<boolean>
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
  expect: (actual: any) => ExpectChain
}

export interface PM {
  response: ResponseUtils
  environment: EnvironmentUtils
  test: (name: string, fn: () => void | Promise<void>) => Promise<void>
  expect: (actual: any) => ExpectChain
}

export interface ExpectChain {
  to: {
    be: {
      below: (expected: number) => boolean
      an: (type: string) => boolean
      oneOf: (expected: any[]) => boolean
    }
    include: (expected: string) => boolean
    have: {
      length: (expected: number) => boolean
    }
    equal: (expected: any) => boolean
    deep: {
      equal: (expected: any) => boolean
    }
    match: (pattern: RegExp) => boolean
  }
}

const validateJsonSchema = (data: any, schema: any): boolean => {
  if (schema.type === 'object') {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new Error(`Expected object but got ${typeof data}`)
    }

    if (schema.required) {
      for (const prop of schema.required) {
        if (!(prop in data)) {
          throw new Error(`Missing required property: ${prop}`)
        }
      }
    }

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries<any>(schema.properties)) {
        if (key in data) {
          validateJsonSchema(data[key], propSchema)
        }
      }
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(data)) {
      throw new Error(`Expected array but got ${typeof data}`)
    }
    if (schema.items) {
      for (const item of data) {
        validateJsonSchema(item, schema.items)
      }
    }
  } else if (schema.type === 'string') {
    if (typeof data !== 'string') {
      throw new Error(`Expected string but got ${typeof data}`)
    }
  } else if (schema.type === 'number') {
    if (typeof data !== 'number') {
      throw new Error(`Expected number but got ${typeof data}`)
    }
  } else if (schema.type === 'boolean') {
    if (typeof data !== 'boolean') {
      throw new Error(`Expected boolean but got ${typeof data}`)
    }
  }
  return true
}

export const createResponseUtils = (response: Response): ResponseUtils => {
  let cachedJson: any
  let cachedText: string | undefined

  // Create a promise that will resolve when the text is ready
  const textPromise = response
    .clone()
    .text()
    .then((text) => {
      cachedText = text
      try {
        cachedJson = JSON.parse(text)
      } catch {
        cachedJson = null
      }
    })

  const responseStartTime = performance.now()

  return {
    json: () => {
      if (cachedJson === undefined) {
        throw new Error('JSON response not ready. This is likely a bug.')
      }
      if (cachedJson === null) {
        throw new Error('Response is not valid JSON')
      }
      return cachedJson
    },
    text: async () => {
      await textPromise // Wait for the text to be ready
      if (cachedText === undefined) {
        throw new Error('Text response not ready. This is likely a bug.')
      }
      return cachedText
    },
    code: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    to: createResponseAssertions(response),
    get responseTime() {
      return Number((performance.now() - responseStartTime).toFixed(2))
    },
  }
}

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
    jsonSchema: async (schema: object) => {
      try {
        const responseData = await response.clone().json()
        return validateJsonSchema(responseData, schema)
      } catch (error) {
        throw new Error(`JSON Schema validation failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
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

export const createExpectChain = (actual: any): ExpectChain => {
  if (actual instanceof Promise) {
    throw new Error('Expected value cannot be a Promise. Make sure to await async values before using expect.')
  }

  return {
    to: {
      be: {
        below: (expected: number) => {
          if (typeof actual !== 'number') {
            throw new Error('Expected value to be a number')
          }
          if (actual >= expected) {
            throw new Error(`Expected ${actual} to be below ${expected}`)
          }
          return true
        },
        an: (type: string) => {
          const actualType = Array.isArray(actual) ? 'array' : typeof actual
          if (actualType !== type) {
            throw new Error(`Expected ${JSON.stringify(actual)} to be an ${type}, but got ${actualType}`)
          }
          return true
        },
        oneOf: (expected: any[]) => {
          if (!Array.isArray(expected)) {
            throw new Error('Expected argument to be an array')
          }
          if (!expected.includes(actual)) {
            throw new Error(`Expected ${JSON.stringify(actual)} to be one of ${JSON.stringify(expected)}`)
          }
          return true
        },
      },
      include: (expected: string) => {
        if (typeof actual !== 'string') {
          throw new Error('Expected value to be a string')
        }

        if (!actual.includes(expected)) {
          throw new Error(`Expected "${actual}" to include "${expected}"`)
        }

        return true
      },
      have: {
        length: (expected: number) => {
          if (typeof actual?.length !== 'number') {
            throw new Error('Expected value to have a length property')
          }
          if (actual.length !== expected) {
            throw new Error(`Expected ${JSON.stringify(actual)} to have length ${expected} but got ${actual.length}`)
          }
          return true
        },
      },
      equal: (expected: any) => {
        if (actual !== expected) {
          throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`)
        }
        return true
      },
      deep: {
        equal: (expected: any) => {
          const actualStr = JSON.stringify(actual)
          const expectedStr = JSON.stringify(expected)
          if (actualStr !== expectedStr) {
            throw new Error(`Expected ${actualStr} to deeply equal ${expectedStr}`)
          }
          return true
        },
      },
      match: (pattern: RegExp) => {
        if (typeof actual !== 'string') {
          throw new Error('Expected value to be a string')
        }
        if (!pattern.test(actual)) {
          throw new Error(`Expected "${actual}" to match ${pattern}`)
        }
        return true
      },
    },
  }
}

export const createPostmanContext = (
  response: Response,
  env: Record<string, any> = {},
  testResults: TestResult[],
  onTestResultsUpdate?: (results: TestResult[]) => void,
): PostmanContext & { pm: PM } => {
  const expect = (actual: any) => createExpectChain(actual)

  const context = {
    response: createResponseUtils(response),
    environment: createEnvironmentUtils(env),
    test: createTestUtils(testResults, onTestResultsUpdate).test,
    expect,
  }

  return {
    ...context,
    pm: {
      ...context,
      expect,
    },
  }
}
