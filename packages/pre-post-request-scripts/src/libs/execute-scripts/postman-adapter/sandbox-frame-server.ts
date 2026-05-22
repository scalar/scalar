import { Request as PostmanRequest } from 'postman-collection'
import type { ExecutionResult, SandboxContext } from 'postman-sandbox'
import Sandbox from 'postman-sandbox'

import { buildSandboxContextFromScopes } from '../build-sandbox-context'
import type { ConsoleContext } from '../context/console'
import type { TestResult } from '../execute-post-response-script'
import { getSandboxOrigins } from './sandbox-origins'
import { SANDBOX_CHANNEL, type SandboxExecuteRequest, type SandboxOutboundMessage } from './sandbox-protocol'

/**
 * Iframe-side sandbox bridge.
 *
 * This is the ONLY module that imports `postman-sandbox` (and therefore the only place that performs
 * `eval`/`new Function`). It is loaded exclusively by the sandbox `.html` host page, which carries its
 * own permissive CSP. The main application bundle never imports this file, so it stays eval-free and
 * its CSP can drop `'unsafe-eval'`.
 */

type AssertionEvent = {
  name: string
  index: number
  passed: boolean
  skipped: boolean
  error: { message?: string } | null
}

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

/**
 * Runs a single script in the postman-sandbox and reports progress/results via {@link emit}.
 *
 * Inputs arrive as plain, structured-cloneable data (already converted on the host) and are rebuilt
 * into postman-collection objects here. Variable mutations and the mutated request are sent back as
 * plain values; the host applies them to the live `VariablesStore`/`RequestFactory`.
 */
export const runSandboxExecution = async (
  request: SandboxExecuteRequest,
  emit: (message: SandboxOutboundMessage) => void,
): Promise<void> => {
  const { id, listen, script, scopes, request: requestDefinition, response } = request

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
    emit({ channel: SANDBOX_CHANNEL, kind: 'test-results', id, results: [...testResults] })
  }

  const handleConsole = (_cursor: unknown, level: string, ...args: unknown[]) => {
    emit({ channel: SANDBOX_CHANNEL, kind: 'console', id, level: level as keyof ConsoleContext, args })
  }

  try {
    sandboxContext.on('execution.assertion', handleAssertion)
    sandboxContext.on('console', handleConsole)

    const variablesContext = scopes ? buildSandboxContextFromScopes(scopes) : undefined

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

    if (requestDefinition !== undefined) {
      context.request = new PostmanRequest(requestDefinition as ConstructorParameters<typeof PostmanRequest>[0])
    }
    if (response !== undefined) {
      context.response = response
    }

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
          const done: SandboxOutboundMessage = {
            channel: SANDBOX_CHANNEL,
            kind: 'done',
            id,
          }

          if (execution) {
            done.variables = {
              local: execution._variables?.values,
              collection: execution.collectionVariables?.values,
              globals: execution.globals?.values,
              environment: execution.environment?.values,
            }
          }

          if (!error && listen === 'prerequest' && execution?.request !== undefined) {
            done.request = execution.request
          }

          if (error) {
            const duration = Number((performance.now() - scriptExecutionStartedAt).toFixed(2))
            const errorMessage = toErrorMessage(error)
            done.error = errorMessage

            emit({
              channel: SANDBOX_CHANNEL,
              kind: 'console',
              id,
              level: 'error',
              args: [
                `[${listen === 'prerequest' ? 'PRE-REQUEST' : 'POST-RESPONSE'} Script] Error (${duration}ms):`,
                errorMessage,
              ],
            })

            testResults.push({
              title: 'Script Execution',
              passed: false,
              duration,
              error: errorMessage,
              status: 'failed',
            })
            emit({ channel: SANDBOX_CHANNEL, kind: 'test-results', id, results: [...testResults] })
          }

          emit(done)
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

/**
 * Boots the sandbox bridge: listens for {@link SandboxExecuteRequest} messages from the host window
 * and announces readiness. Called by the sandbox `.html` entry point.
 *
 * Returns a teardown function that removes the `message` listener it registered. Production code
 * does not need to call it (the iframe lives for the lifetime of the document), but tests and any
 * future hot-reload path can use it to avoid leaking listeners across reboots.
 */
export const startSandboxFrameServer = (): (() => void) => {
  /**
   * Origin we pin `postMessage` exchanges to.
   *
   * The iframe is loaded same-origin with its host (see `sandbox.html`), so both the parent we
   * post to and the parent we accept from are pinned to `window.location.origin`. This prevents
   * a hostile cross-origin opener from feeding fake execute requests into the sandbox, and stops
   * sandbox output (which can include user secrets returned via `pm.environment`) from leaking
   * to a different origin if the parent is ever swapped out.
   *
   * For `file://` documents (Electron), Chromium reports message origins as `'null'` and does not
   * allow `'file://'` as a `postMessage` target origin. In that case we target `'*'` and rely on the
   * exact parent/source-window checks on both sides for isolation.
   */
  const { receive: expectedOrigin, send: targetOrigin } = getSandboxOrigins()

  const post = (message: SandboxOutboundMessage) => {
    window.parent?.postMessage(message, targetOrigin)
  }

  const handleMessage = (event: MessageEvent) => {
    // Reject anything that is not from our parent on our own origin. Without this guard, any
    // window that obtains a reference to this iframe could send fabricated execute payloads and
    // run arbitrary scripts inside the eval-permitted realm.
    if (event.origin !== expectedOrigin || event.source !== window.parent) {
      return
    }

    const data = event.data as Partial<SandboxExecuteRequest> | null
    if (!data || data.channel !== SANDBOX_CHANNEL || data.kind !== 'execute') {
      return
    }

    void runSandboxExecution(data as SandboxExecuteRequest, post).catch((error: unknown) => {
      post({
        channel: SANDBOX_CHANNEL,
        kind: 'done',
        id: (data as SandboxExecuteRequest).id,
        error: toErrorMessage(error),
      })
    })
  }

  window.addEventListener('message', handleMessage)
  post({ channel: SANDBOX_CHANNEL, kind: 'ready' })

  return () => window.removeEventListener('message', handleMessage)
}
