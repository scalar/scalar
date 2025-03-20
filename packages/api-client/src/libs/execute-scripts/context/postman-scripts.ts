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
    [key: string]: any
    exist: () => boolean
    be: {
      [key: string]: any
      below: (expected: number) => boolean
      an: (type: string) => boolean
      oneOf: (expected: any[]) => boolean
      null: () => boolean
      undefined: () => boolean
      empty: () => boolean
      true: () => boolean
      false: () => boolean
      above: (expected: number) => boolean
      at: {
        least: (expected: number) => boolean
      }
    }
    include: (expected: string) => boolean
    have: {
      [key: string]: any
      length: (expected: number) => boolean
      property: (name: string, value?: any) => boolean
      keys: (keys: string[]) => boolean
    }
    equal: (expected: any) => boolean
    deep: {
      equal: (expected: any) => boolean
    }
    match: (pattern: RegExp) => boolean
  }
  not: {
    to: ExpectChain['to']
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

  const chain = {
    to: {
      exist: () => {
        if (actual === null || actual === undefined) {
          throw new Error(`Expected value to exist but got ${actual}`)
        }
        return true
      },
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
        null: () => {
          if (actual !== null) {
            throw new Error('Expected value to be null')
          }
          return true
        },
        undefined: () => {
          if (actual !== undefined) {
            throw new Error('Expected value to be undefined')
          }
          return true
        },
        empty: () => {
          if (Array.isArray(actual)) {
            if (actual.length !== 0) {
              throw new Error('Expected array to be empty')
            }
          } else if (typeof actual === 'string') {
            if (actual !== '') {
              throw new Error('Expected string to be empty')
            }
          } else if (typeof actual === 'object' && actual !== null) {
            if (Object.keys(actual).length !== 0) {
              throw new Error('Expected object to be empty')
            }
          } else {
            throw new Error('Expected value to be an array, string, or object')
          }
          return true
        },
        true: () => {
          if (actual !== true) {
            throw new Error('Expected value to be true')
          }
          return true
        },
        false: () => {
          if (actual !== false) {
            throw new Error('Expected value to be false')
          }
          return true
        },
        above: (expected: number) => {
          if (typeof actual !== 'number') {
            throw new Error('Expected value to be a number')
          }
          if (actual <= expected) {
            throw new Error(`Expected ${actual} to be above ${expected}`)
          }
          return true
        },
        at: {
          least: (expected: number) => {
            if (typeof actual !== 'number') {
              throw new Error('Expected value to be a number')
            }
            if (actual < expected) {
              throw new Error(`Expected ${actual} to be at least ${expected}`)
            }
            return true
          },
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
        property: (name: string, value?: any) => {
          if (typeof actual !== 'object' || actual === null || !Object.prototype.hasOwnProperty.call(actual, name)) {
            throw new Error(`Expected object to have property "${name}"`)
          }
          if (value !== undefined && actual[name] !== value) {
            throw new Error(`Expected property "${name}" to equal ${value} but got ${actual[name]}`)
          }
          return true
        },
        keys: (keys: string[]) => {
          if (typeof actual !== 'object' || actual === null) {
            throw new Error('Expected value to be an object')
          }
          const missingKeys = keys.filter((key) => !Object.prototype.hasOwnProperty.call(actual, key))
          if (missingKeys.length > 0) {
            throw new Error(`Expected object to have keys: ${missingKeys.join(', ')}`)
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
  } as ExpectChain

  // Create the negated version of all assertions
  const not = {
    to: Object.entries(chain.to).reduce<ExpectChain['to']>(
      (acc, [key, value]) => {
        if (typeof value === 'function') {
          acc[key] = (...args: any[]) => {
            try {
              ;(value as Function)(...args)
            } catch (error) {
              // If the original assertion failed, the negation passes
              return true
            }
            // If we get here, the original assertion passed, so the negation should fail
            throw new Error(
              `Expected ${JSON.stringify(actual)} to not ${key} ${args.map((arg) => JSON.stringify(arg)).join(', ')}`,
            )
          }
        } else if (typeof value === 'object') {
          acc[key] = Object.entries(value as Record<string, any>).reduce<Record<string, any>>(
            (subAcc, [subKey, subValue]) => {
              if (typeof subValue === 'function') {
                subAcc[subKey] = (...args: any[]) => {
                  try {
                    ;(subValue as Function)(...args)
                  } catch (error) {
                    // If the original assertion failed, the negation passes
                    return true
                  }
                  // If we get here, the original assertion passed, so the negation should fail
                  throw new Error(
                    `Expected ${JSON.stringify(actual)} to not ${key}.${subKey} ${args
                      .map((arg) => JSON.stringify(arg))
                      .join(', ')}`,
                  )
                }
              }
              return subAcc
            },
            {},
          )
        }
        return acc
      },
      {} as ExpectChain['to'],
    ),
  }

  return { ...chain, not }
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
