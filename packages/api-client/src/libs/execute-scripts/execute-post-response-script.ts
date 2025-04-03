import { type ConsoleContext, createConsoleContext } from './context/console'
import { type PostmanContext, createPostmanContext } from './context/postman-scripts'

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

const createContext = ({
  response,
  responseText,
  onTestResultsUpdate,
}: {
  response: Response
  responseText: string
  onTestResultsUpdate?: ((results: TestResult[]) => void) | undefined
}): { globalProxy: any; context: ScriptContext } => {
  const globalProxy = createGlobalProxy()
  const testResults: TestResult[] = []

  const context: ScriptContext = {
    response: createResponseContext(response),
    console: createConsoleContext(),
    pm: createPostmanContext(response, responseText, {}, testResults, onTestResultsUpdate),
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
  data: {
    response: Response
    onTestResultsUpdate?: ((results: TestResult[]) => void) | undefined
  },
): Promise<void> => {
  if (!script) {
    return
  }

  // Get response text before executing script
  const responseText = await data.response.clone().text()

  const { globalProxy, context } = createContext({
    response: data.response,
    responseText,
    onTestResultsUpdate: data.onTestResultsUpdate,
  })

  const startTime = performance.now()

  try {
    const scriptFn = createScriptFunction(script)
    scriptFn.call(globalProxy, globalProxy, context)
  } catch (error: unknown) {
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
