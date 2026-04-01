import type { VariablesStore } from '@scalar/oas-utils/helpers'
import type { RequestFactory } from '@scalar/workspace-store/request-example'
import type { ExecutionResult, SandboxContext } from 'postman-sandbox'
import Sandbox from 'postman-sandbox'

import { buildSandboxContextFromStore } from './build-sandbox-context'
import type { ConsoleContext } from './context/console'
import type { TestResult } from './execute-post-response-script'
import { syncPlainPostmanRequestToRequestFactory } from './request-factory-postman-adapter'
import {
  applyExecutionCollectionVariables,
  applyExecutionGlobals,
  applyExecutionLocalVariables,
} from './variables-store'

type AssertionEvent = {
  name: string
  index: number
  passed: boolean
  skipped: boolean
  error: { message?: string } | null
}

const toPostmanResponse = async (response: Response) => {
  const responseText = await response.text()
  const responseBytes = Array.from(new TextEncoder().encode(responseText))

  return {
    code: response.status,
    status: response.statusText || String(response.status),
    header: Array.from(response.headers.entries()).map(([key, value]) => ({ key, value })),
    stream: {
      type: 'Buffer',
      data: responseBytes,
    },
  }
}

const createContext = (): Promise<SandboxContext> =>
  new Promise((resolve, reject) => {
    Sandbox.createContext((error: unknown, context: SandboxContext) => {
      if (error) {
        reject(error)
        return
      }

      resolve(context)
    })
  })

const toErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }

  return String(error)
}

const upsertTestResult = (testResults: TestResult[], assertion: AssertionEvent, duration: number): void => {
  const title = assertion.name || `Assertion ${assertion.index + 1}`

  const nextResult: TestResult = {
    title,
    passed: assertion.passed,
    duration,
    error: assertion.error?.message,
    status: assertion.passed ? 'passed' : 'failed',
  }

  const existingResultIndex = testResults.findIndex((result) => result.title === title)
  if (existingResultIndex === -1) {
    testResults.push(nextResult)
    return
  }

  testResults[existingResultIndex] = nextResult
}

export const executeInPostmanSandbox = async ({
  script,
  type,
  context: { request, response, variablesStore, scriptConsole },
  onTestResultsUpdate,
  /** Pre-request only: sync `pm.request` mutations from the execution result (host `Request` is not mutated). */
  requestFactory,
}: {
  script: string
  type: 'pre-request' | 'post-response'
  context: {
    /** Postman Collection request for `pm.request` (not the browser Fetch API Request). */
    request?: unknown
    response?: Response
    variablesStore?: VariablesStore
    scriptConsole: ConsoleContext
  }
  onTestResultsUpdate?: ((results: TestResult[]) => void) | undefined
  requestFactory?: RequestFactory
}): Promise<VariablesStore | undefined> => {
  const testResults: TestResult[] = []
  let lastAssertionTime = 0
  let scriptExecutionStartedAt = 0
  const sandboxContext = await createContext()

  const handleAssertion = (_cursor: unknown, assertions: AssertionEvent[]) => {
    assertions.forEach((assertion) => {
      const duration = Number((performance.now() - lastAssertionTime).toFixed(2))
      lastAssertionTime = performance.now()
      upsertTestResult(testResults, assertion, duration)
    })
    onTestResultsUpdate?.([...testResults])
  }

  const variablesContext = variablesStore ? buildSandboxContextFromStore(variablesStore) : undefined

  const handleConsole = (_cursor: unknown, level: keyof ConsoleContext, ...args: unknown[]) => {
    const consoleMethod = scriptConsole[level] ?? scriptConsole.log
    ;(consoleMethod as (...params: unknown[]) => void)(...args)
  }

  try {
    sandboxContext.on('execution.assertion', handleAssertion)
    sandboxContext.on('console', handleConsole)

    const postmanResponse = response ? await toPostmanResponse(response) : undefined

    scriptExecutionStartedAt = performance.now()
    lastAssertionTime = scriptExecutionStartedAt

    /**
     * Lodash `_.has(context, 'response')` is true even when the value is `undefined`,
     * which makes the sandbox run `new Response(undefined)` and breaks `pm.request`.
     * Only set keys that are actually present.
     */
    const context: Record<string, unknown> = {
      ...(variablesContext ?? {}),
    }
    if (request !== undefined) {
      context.request = request
    }
    if (postmanResponse !== undefined) {
      context.response = postmanResponse
    }

    const listen = type === 'pre-request' ? 'prerequest' : 'test'

    await new Promise<void>((resolve) => {
      sandboxContext.execute(
        {
          listen,
          script: {
            exec: [script],
          },
        },
        {
          disableLegacyAPIs: true,
          context,
        },
        (error: unknown, execution?: ExecutionResult) => {
          if (variablesStore && execution) {
            if (execution._variables?.values) {
              applyExecutionLocalVariables(variablesStore, execution._variables.values)
            }
            if (execution.collectionVariables?.values) {
              applyExecutionCollectionVariables(variablesStore, execution.collectionVariables.values)
            }
            if (execution.globals?.values) {
              applyExecutionGlobals(variablesStore, execution.globals.values)
            }
          }
          console.log({ execution })
          if (!error && type === 'pre-request' && requestFactory && execution?.request !== undefined) {
            syncPlainPostmanRequestToRequestFactory(execution.request, requestFactory)
          }
          if (error) {
            const duration = Number((performance.now() - scriptExecutionStartedAt).toFixed(2))
            const errorMessage = toErrorMessage(error)

            scriptConsole.error(`[${type.toUpperCase()} Script] Error (${duration}ms):`, errorMessage)

            testResults.push({
              title: 'Script Execution',
              passed: false,
              duration,
              error: errorMessage,
              status: 'failed',
            })
            onTestResultsUpdate?.([...testResults])
          }

          resolve()
        },
      )
    })
  } finally {
    sandboxContext.off('execution.assertion', handleAssertion)
    sandboxContext.off('console', handleConsole)
    sandboxContext.dispose()
  }

  return variablesStore
}
