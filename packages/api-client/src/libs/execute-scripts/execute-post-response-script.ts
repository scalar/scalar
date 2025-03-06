export type TestResult = {
  title: string
  success: boolean
  duration: number
  error?: string
  status: 'pending' | 'success' | 'failure'
}

export interface ScriptContext {
  response: ResponseContext
  console: ConsoleContext
  pm: PostmanContext
  testResults: TestResult[]
}

interface ResponseContext {
  status: number
  statusText: string
  headers: Record<string, string>
}

interface ConsoleContext {
  log: (...args: any[]) => void
  error: (...args: any[]) => void
  warn: (...args: any[]) => void
}

interface PostmanContext {
  response: ResponseUtils
  environment: EnvironmentUtils
  test: (name: string, fn: () => void | Promise<void>) => Promise<void>
}

interface ResponseUtils {
  json: () => Promise<any>
  text: () => Promise<string>
  code: number
  headers: Record<string, string>
  to: ResponseAssertions
}

interface ResponseAssertions {
  have: {
    status: (expectedStatus: number) => boolean
    header: (headerName: string) => HeaderAssertions
  }
  be: {
    json: () => Promise<boolean>
  }
}

interface HeaderAssertions {
  that: {
    equals: (expectedValue: string) => boolean
    includes: (expectedValue: string) => boolean
  }
}

interface EnvironmentUtils {
  get: (key: string) => string | undefined
  set: () => boolean
}

// Utilities
const createGlobalProxy = () => {
  return new Proxy(
    {},
    {
      get(_, prop: string) {
        const allowedGlobals = ['console', 'JSON', 'Math', 'Date', 'RegExp', 'String', 'Number', 'Boolean']
        if (allowedGlobals.includes(prop)) {
          return (globalThis as any)[prop]
        }
        return undefined
      },
      set() {
        return false
      },
    },
  )
}

const createConsoleContext = () => ({
  log: (...args: any[]) => console.log('[Script]', ...args),
  error: (...args: any[]) => console.error('[Script Error]', ...args),
  warn: (...args: any[]) => console.warn('[Script Warning]', ...args),
})

const createResponseContext = (response: Response): ResponseContext => ({
  status: response.status,
  statusText: response.statusText,
  headers: Object.fromEntries(response.headers.entries()),
})

const createResponseUtils = (response: Response): ResponseUtils => ({
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

const createResponseAssertions = (response: Response): ResponseAssertions => ({
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

const createEnvironmentUtils = (): EnvironmentUtils => ({
  get: (key: string) => {
    const allowedVars = ['NODE_ENV', 'API_URL']
    if (allowedVars.includes(key)) {
      return import.meta.env[key]
    }
    return undefined
  },
  set: () => false,
})

const createTestUtils = (testResults: TestResult[], onTestResultUpdate?: (result: TestResult) => void) => ({
  test: async (name: string, fn: () => void | Promise<void>) => {
    const testStartTime = performance.now()
    const pendingResult: TestResult = {
      title: name,
      success: false,
      duration: Number((performance.now() - testStartTime).toFixed(2)),
      status: 'pending',
    }
    testResults.push(pendingResult)
    onTestResultUpdate?.(pendingResult)

    try {
      await Promise.resolve(fn())
      const testEndTime = performance.now()
      const duration = Number((testEndTime - testStartTime).toFixed(2))
      const result: TestResult = {
        title: name,
        success: true,
        duration,
        status: 'success',
      }
      updateTestResult(testResults, name, result)
      onTestResultUpdate?.(result)
      console.log(`✓ ${name}`)
    } catch (error: unknown) {
      const testEndTime = performance.now()
      const duration = Number((testEndTime - testStartTime).toFixed(2))
      const errorMessage = error instanceof Error ? error.message : String(error)
      const result: TestResult = {
        title: name,
        success: false,
        duration,
        error: errorMessage,
        status: 'failure',
      }
      updateTestResult(testResults, name, result)
      onTestResultUpdate?.(result)
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

const createScriptContext = ({
  response,
  onTestResultUpdate,
}: {
  response: Response
  onTestResultUpdate?: (result: TestResult) => void
}): { globalProxy: any; context: ScriptContext } => {
  const globalProxy = createGlobalProxy()
  const testResults: TestResult[] = []

  const context: ScriptContext = {
    response: createResponseContext(response),
    console: createConsoleContext(),
    pm: {
      response: createResponseUtils(response),
      environment: createEnvironmentUtils(),
      test: createTestUtils(testResults, onTestResultUpdate).test,
    },
    testResults,
  }

  return { globalProxy, context }
}

const createScriptFunction = (script: string) => {
  return new Function(
    'global',
    'context',
    `
    "use strict";

    const pm = context.pm;
    const response = context.response;
    const console = context.console;

    ${script}
    `,
  )
}

export const executePostResponseScript = async (
  script: string | undefined,
  data: { response: Response; onTestResultUpdate?: (result: TestResult) => void },
): Promise<void> => {
  if (!script) return

  const { globalProxy, context } = createScriptContext(data)
  const startTime = performance.now()

  try {
    console.log('[Post-Response Script] Executing script')
    const scriptFn = createScriptFunction(script)
    await scriptFn.call(globalProxy, globalProxy, context)

    const duration = (performance.now() - startTime).toFixed(2)
    console.log(`[Post-Response Script] Completed (${duration}ms)`)
  } catch (error: unknown) {
    const duration = (performance.now() - startTime).toFixed(2)
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error(`[Post-Response Script] Error (${duration}ms):`, errorMessage)

    const scriptErrorResult: TestResult = {
      title: 'Script Execution',
      success: false,
      duration: Number(duration),
      error: errorMessage,
      status: 'failure',
    }
    context.testResults.push(scriptErrorResult)
    data.onTestResultUpdate?.(scriptErrorResult)
  }
}
