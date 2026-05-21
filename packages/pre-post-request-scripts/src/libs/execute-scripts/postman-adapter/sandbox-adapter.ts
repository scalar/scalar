import type { RequestFactory, VariablesStore } from '@scalar/workspace-store/request-example'

import type { ConsoleContext } from '../context/console'
import type { TestResult } from '../execute-post-response-script'
import { getVariableScopesFromStore, toVariableEntries } from '../variables-store'
import { createPostmanRequestFromFactory, syncPlainPostmanRequestToRequestFactory } from './request-factory-adapter'
import {
  type PostmanResponseDefinition,
  SANDBOX_CHANNEL,
  type SandboxExecuteRequest,
  type SandboxOutboundMessage,
} from './sandbox-protocol'

/**
 * Host-side adapter for pre/post-request scripts.
 *
 * The actual script execution happens in `postman-sandbox`, which requires `eval`. To keep
 * `'unsafe-eval'` out of the main application CSP, that execution is delegated to an iframe loaded
 * from a real same-origin `.html` file with its own permissive CSP (see `sandbox-frame-server.ts`).
 * This module therefore must NOT import `postman-sandbox`; it only serializes inputs, talks to the
 * iframe over `postMessage`, and applies the results back to the live store/request.
 */
export const toPostmanResponse = async (response: Response): Promise<PostmanResponseDefinition> => {
  // Read as ArrayBuffer (not text) so binary payloads — gzipped JSON, images, PDFs, protobuf —
  // survive the trip through `postMessage` byte-for-byte. Round-tripping through `response.text()`
  // + `TextEncoder` corrupts any sequence that is not valid UTF-8 because the decoder replaces
  // invalid units with U+FFFD before we ever encode them back to bytes.
  const buffer = await response.arrayBuffer()
  const responseBytes = Array.from(new Uint8Array(buffer))

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

/** Resolves the sandbox iframe URL relative to the current document so it works for web and Electron `file://`. */
const sandboxFrameUrl = (): string => new URL('sandbox.html', document.baseURI).href

/**
 * Origin we pin `postMessage` exchanges to.
 *
 * The sandbox iframe is served from the same origin as the host (see `sandbox.html`), so we lock
 * every send and receive to `window.location.origin`. Pinning the send origin prevents the payload
 * from leaking if the frame is ever navigated away to another origin; pinning the receive origin
 * prevents another window (for example a cross-origin opener) from spoofing sandbox messages.
 *
 * For `file://` documents (Electron), `window.location.origin` is the string `'file://'`, which is
 * the same value `postMessage` reports on `event.origin`, so the pin still holds.
 */
const sandboxOrigin = (): string => window.location.origin

/**
 * Delivers a single execute request to the sandbox and forwards every message it produces (test
 * results, console output, and the final `done`) to `onMessage`.
 *
 * The default transport is the iframe (see {@link iframeTransport}). It is injectable so that node
 * unit tests can run the real execution in-process (`runSandboxExecution`) without a DOM, and without
 * the production host bundle ever importing `postman-sandbox`.
 */
export type SandboxTransport = (
  request: SandboxExecuteRequest,
  onMessage: (message: SandboxOutboundMessage) => void,
) => void

let framePromise: Promise<Window> | undefined

/** Lazily creates a single hidden sandbox iframe and resolves once it reports readiness. */
const ensureSandboxFrame = (): Promise<Window> => {
  if (framePromise) {
    return framePromise
  }

  framePromise = new Promise<Window>((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.display = 'none'
    iframe.src = sandboxFrameUrl()

    const expectedOrigin = sandboxOrigin()

    const onReady = (event: MessageEvent) => {
      // Same-origin iframe: reject anything that does not come from our own origin and our own frame.
      if (event.origin !== expectedOrigin || event.source !== iframe.contentWindow) {
        return
      }
      const data = event.data as SandboxOutboundMessage | null
      if (!data || data.channel !== SANDBOX_CHANNEL || data.kind !== 'ready') {
        return
      }
      window.removeEventListener('message', onReady)
      if (!iframe.contentWindow) {
        // Tear the orphaned node down so a retry can append a fresh frame without piling up.
        iframe.remove()
        framePromise = undefined
        reject(new Error('Sandbox iframe has no content window'))
        return
      }
      resolve(iframe.contentWindow)
    }

    iframe.addEventListener('error', () => {
      window.removeEventListener('message', onReady)
      // Drop the broken iframe from the DOM. Without this, a transient failure (network blip, bad
      // bundle path, etc.) leaves a dead `<iframe>` attached, and every retry appends another one,
      // growing the DOM unboundedly across the session.
      iframe.remove()
      framePromise = undefined
      reject(new Error('Failed to load the script sandbox iframe'))
    })

    window.addEventListener('message', onReady)
    document.body.appendChild(iframe)
  })

  return framePromise
}

/**
 * Maximum time we wait for the iframe to emit `kind: 'done'` for a given execute request.
 *
 * postman-sandbox enforces its own per-script timeout inside the sandbox, so reaching this ceiling
 * means the iframe itself wedged (renderer OOM, hard crash, blocking infinite loop in a worker,
 * messages dropped). The default is generous on purpose — this is a circuit-breaker for crashes,
 * not a budget for user scripts.
 */
const SANDBOX_EXECUTION_TIMEOUT_MS = 5 * 60 * 1000

const iframeTransport: SandboxTransport = (request, onMessage) => {
  ensureSandboxFrame()
    .then((frame) => {
      const expectedOrigin = sandboxOrigin()

      // Defensive circuit-breaker: if the iframe dies mid-execution we would otherwise wait on a
      // `done` message that will never arrive, leaking the listener and leaving the caller's
      // promise unresolved. The timer is cancelled the moment `done` is observed below.
      const timeoutId = setTimeout(() => {
        window.removeEventListener('message', handleMessage)
        onMessage({
          channel: SANDBOX_CHANNEL,
          kind: 'done',
          id: request.id,
          error: `Script execution timed out after ${SANDBOX_EXECUTION_TIMEOUT_MS}ms`,
        })
      }, SANDBOX_EXECUTION_TIMEOUT_MS)

      const handleMessage = (event: MessageEvent) => {
        // Reject anything that is not from our own origin and our own frame. Without this guard,
        // any window in the same browsing context group could send fabricated `done`/`test-results`
        // messages and trick the host into applying attacker-controlled variables and requests.
        if (event.origin !== expectedOrigin || event.source !== frame) {
          return
        }
        const data = event.data as SandboxOutboundMessage | null
        if (!data || data.channel !== SANDBOX_CHANNEL || !('id' in data) || data.id !== request.id) {
          return
        }
        if (data.kind === 'done') {
          clearTimeout(timeoutId)
          window.removeEventListener('message', handleMessage)
        }
        onMessage(data)
      }

      window.addEventListener('message', handleMessage)
      // Pin the target origin: the execute payload contains environments, headers, secrets, and
      // potentially auth tokens, so we must never broadcast it with `'*'`.
      frame.postMessage(request, expectedOrigin)
    })
    .catch((error: unknown) => {
      onMessage({
        channel: SANDBOX_CHANNEL,
        kind: 'done',
        id: request.id,
        error: error instanceof Error ? error.message : String(error),
      })
    })
}
let transport: SandboxTransport = iframeTransport

/** Override how the host reaches the sandbox (e.g. an in-process transport for tests). */
export const setSandboxTransport = (next: SandboxTransport): void => {
  transport = next
}

let nextExecutionId = 0

export const executeInPostmanSandbox = async ({
  script,
  type,
  context: { requestBuilder, response, variablesStore, scriptConsole },
  onTestResultsUpdate,
}: {
  script: string
  type: 'pre-request' | 'post-response'
  context: {
    /** Postman Collection request for `pm.request` (not the browser Fetch API Request). */
    requestBuilder?: RequestFactory
    response?: Response
    variablesStore?: VariablesStore
    scriptConsole: ConsoleContext
  }
  onTestResultsUpdate?: ((results: TestResult[]) => void) | undefined
}): Promise<VariablesStore | undefined> => {
  // Serialize everything that crosses the iframe boundary on the host, so the iframe only deals with
  // plain, structured-cloneable data. The response body is read here (it requires the live Response).
  const requestDefinition = requestBuilder ? createPostmanRequestFromFactory(requestBuilder).toJSON() : undefined
  const responseDefinition = response ? await toPostmanResponse(response) : undefined
  const scopes = variablesStore ? getVariableScopesFromStore(variablesStore) : undefined

  const request: SandboxExecuteRequest = {
    channel: SANDBOX_CHANNEL,
    kind: 'execute',
    id: String(nextExecutionId++),
    listen: type === 'pre-request' ? 'prerequest' : 'test',
    script,
    scopes,
    request: requestDefinition,
    response: responseDefinition,
  }

  await new Promise<void>((resolve) => {
    const onMessage = (data: SandboxOutboundMessage) => {
      if (data.kind === 'test-results') {
        onTestResultsUpdate?.(data.results)
        return
      }

      if (data.kind === 'console') {
        const consoleMethod = scriptConsole[data.level] ?? scriptConsole.log
        ;(consoleMethod as (...params: unknown[]) => void)(...data.args)
        return
      }

      if (data.kind === 'done') {
        if (variablesStore && data.variables) {
          const { local, collection, globals, environment } = data.variables
          if (local) {
            variablesStore.setLocalVariables(toVariableEntries(local))
          }
          if (collection) {
            variablesStore.setCollectionVariables?.(toVariableEntries(collection))
          }
          if (globals) {
            variablesStore.setGlobals?.(toVariableEntries(globals))
          }
          if (environment) {
            variablesStore.setEnvironment?.(toVariableEntries(environment))
          }
        }

        if (!data.error && type === 'pre-request' && requestBuilder && data.request !== undefined) {
          syncPlainPostmanRequestToRequestFactory(data.request, requestBuilder)
        }

        resolve()
      }
    }

    transport(request, onMessage)
  })

  return variablesStore
}
