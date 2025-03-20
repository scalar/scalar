export type TestResult = {
  title: string
  passed: boolean
  duration: number
  error?: string
  status: 'pending' | 'passed' | 'failed'
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

import { type ConsoleContext, createConsoleContext } from './context/console'
import {
  type PostmanContext,
  createEnvironmentUtils,
  createResponseUtils,
  createTestUtils,
} from './context/postman-scripts'

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

const createResponseContext = (response: Response): ResponseContext => ({
  status: response.status,
  statusText: response.statusText,
  headers: Object.fromEntries(response.headers.entries()),
})

const createScriptContext = ({
  response,
  onTestResultsUpdate,
}: {
  response: Response
  onTestResultsUpdate?: ((results: TestResult[]) => void) | undefined
}): { globalProxy: any; context: ScriptContext } => {
  const globalProxy = createGlobalProxy()
  const testResults: TestResult[] = []

  const context: ScriptContext = {
    response: createResponseContext(response),
    console: createConsoleContext(),
    pm: {
      response: createResponseUtils(response),
      environment: createEnvironmentUtils(),
      test: createTestUtils(testResults, onTestResultsUpdate).test,
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
  data: { response: Response; onTestResultsUpdate?: ((results: TestResult[]) => void) | undefined },
): Promise<void> => {
  if (!script) {
    return
  }

  const { globalProxy, context } = createScriptContext(data)
  const startTime = performance.now()

  // Executing script
  try {
    // console.log('[Post-Response Script] Executing script')
    const scriptFn = createScriptFunction(script)
    await scriptFn.call(globalProxy, globalProxy, context)
  } catch (error: unknown) {
    // Catching script errors
    const duration = (performance.now() - startTime).toFixed(2)
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error(`[Post-Response Script] Error (${duration}ms):`, errorMessage)

    const scriptErrorResult: TestResult = {
      title: 'Script Execution',
      passed: false,
      duration: Number(duration),
      error: errorMessage,
      status: 'failed',
    }
    context.testResults.push(scriptErrorResult)
    data.onTestResultsUpdate?.(context.testResults)
  }
}
