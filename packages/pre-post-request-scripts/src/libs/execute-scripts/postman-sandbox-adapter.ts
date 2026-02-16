import type { SandboxContext } from 'postman-sandbox'
import Sandbox from 'postman-sandbox'

import type { ConsoleContext } from './context/console'
import type { TestResult } from './execute-post-response-script'

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
  response,
  onTestResultsUpdate,
  scriptConsole,
}: {
  script: string
  response: Response
  onTestResultsUpdate?: ((results: TestResult[]) => void) | undefined
  scriptConsole: ConsoleContext
}): Promise<void> => {
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

  const handleConsole = (_cursor: unknown, level: keyof ConsoleContext, ...args: unknown[]) => {
    const consoleMethod = scriptConsole[level] ?? scriptConsole.log
    ;(consoleMethod as (...params: unknown[]) => void)(...args)
  }

  try {
    sandboxContext.on('execution.assertion', handleAssertion)
    sandboxContext.on('console', handleConsole)

    const postmanResponse = await toPostmanResponse(response)

    scriptExecutionStartedAt = performance.now()
    lastAssertionTime = scriptExecutionStartedAt

    await new Promise<void>((resolve) => {
      sandboxContext.execute(
        {
          listen: 'test',
          script: {
            exec: [script],
          },
        },
        {
          disableLegacyAPIs: true,
          context: {
            response: postmanResponse,
          },
        },
        (error: unknown) => {
          if (error) {
            const duration = Number((performance.now() - scriptExecutionStartedAt).toFixed(2))
            const errorMessage = toErrorMessage(error)

            scriptConsole.error(`[Post-Response Script] Error (${duration}ms):`, errorMessage)

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
}
