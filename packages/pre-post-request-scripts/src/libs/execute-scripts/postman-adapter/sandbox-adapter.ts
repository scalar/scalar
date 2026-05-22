import { normalizeError } from '@scalar/helpers/errors/normalize-error'
import { isElectron } from '@scalar/helpers/general/is-electron'
import type { RequestFactory, VariablesStore } from '@scalar/workspace-store/request-example'

import type { ConsoleContext } from '../context/console'
import type { TestResult } from '../execute-post-response-script'
import { getVariableScopesFromStore, toVariableEntries } from '../variables-store'
import { createPostmanRequestFromFactory, syncPlainPostmanRequestToRequestFactory } from './request-factory-adapter'
import { getSandboxOrigins } from './sandbox-origins'
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

/**
 * Resolves the sandbox iframe URL.
 *
 * On the web we anchor to the origin root because the SPA router owns the current path: a
 * relative `sandbox.html` would resolve under the active route and get rewritten to `index.html`
 * by the history fallback. In Electron the document path is literal, so a sibling resolution
 * works — and we use the `isElectron` helper rather than a `file://` check because Electron's
 * dev mode is served over `http://localhost`.
 *
 * Exported for tests; production code reaches it through `ensureSandboxFrame`.
 */
export const sandboxFrameUrl = (): string => {
  if (isElectron()) {
    return new URL('sandbox.html', document.baseURI).href
  }
  return new URL('/sandbox.html', window.location.origin).href
}

/**
 * Delivers a single execute request to the sandbox and forwards every message it produces (test
 * results, console output, and the final `done`) to `onMessage`.
 *
 * The default transport is the iframe (see {@link iframeTransport}). It is injectable so that node
 * unit tests can run the real execution in-process (`runSandboxExecution`) without a DOM, and without
 * the production host bundle ever importing `postman-sandbox`.
 */
type SandboxTransport = (request: SandboxExecuteRequest, onMessage: (message: SandboxOutboundMessage) => void) => void

type SandboxFrame = {
  element: HTMLIFrameElement
  id: number
  url: string
  window: Window
}

let framePromise: Promise<SandboxFrame> | undefined
let activeFrameId: number | undefined
let nextFrameId = 0

/**
 * Maximum time we wait for a freshly created sandbox iframe to post its `ready` handshake.
 *
 * The iframe `error` event fires only when the `.html` document itself fails to load. If the
 * document loads (HTTP 200) but the script inside never reaches `startSandboxFrameServer` — a
 * 404 on the bundle, an import error, a CSP block, a crash during boot — no `ready` message is
 * posted and no `error` event fires. Without this ceiling the readiness promise hangs forever;
 * because it is module-cached, every later call awaits the same dead promise and all script
 * execution freezes for the session. The window is generous: readiness only requires loading one
 * same-origin HTML file plus the sandbox bundle, so timing out means the bundle is genuinely
 * broken rather than slow.
 */
const SANDBOX_READY_TIMEOUT_MS = 30 * 1000

const clearActiveFrame = (id: number): void => {
  if (activeFrameId === id) {
    framePromise = undefined
    activeFrameId = undefined
  }
}

const invalidateSandboxFrame = ({ element, id }: SandboxFrame): void => {
  clearActiveFrame(id)
  element.remove()
}

const assertSandboxFrameLocation = (sandboxFrame: SandboxFrame): void => {
  const { element, url, window: frameWindow } = sandboxFrame
  if (!element.isConnected || !document.body.contains(element)) {
    invalidateSandboxFrame(sandboxFrame)
    throw new Error('Sandbox iframe was detached before script execution')
  }

  if (element.contentWindow !== frameWindow) {
    invalidateSandboxFrame(sandboxFrame)
    throw new Error('Sandbox iframe window changed before script execution')
  }

  let currentUrl: string

  try {
    currentUrl = frameWindow.location.href
  } catch (error) {
    invalidateSandboxFrame(sandboxFrame)
    const message = normalizeError(error).message
    throw new Error(`Could not verify sandbox iframe location before script execution: ${message}`)
  }

  if (currentUrl !== url) {
    invalidateSandboxFrame(sandboxFrame)
    throw new Error('Sandbox iframe navigated before script execution')
  }
}

/** Lazily creates a single hidden sandbox iframe and resolves once it reports readiness. */
const ensureSandboxFrame = (): Promise<SandboxFrame> => {
  if (framePromise) {
    return framePromise
  }

  framePromise = new Promise<SandboxFrame>((resolve, reject) => {
    const frameId = nextFrameId++
    activeFrameId = frameId
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.display = 'none'
    const iframeUrl = sandboxFrameUrl()
    iframe.src = iframeUrl

    const { receive: expectedOrigin } = getSandboxOrigins()

    // Cleanup shared by the success, load-error, and readiness-timeout paths: cancel the timer and
    // drop the window listener so exactly one of the three settles the promise without leaking.
    let readyTimeoutId: ReturnType<typeof setTimeout>
    const stopWaiting = () => {
      clearTimeout(readyTimeoutId)
      window.removeEventListener('message', onReady)
    }

    const onReady = (event: MessageEvent) => {
      // Same-origin iframe: reject anything that does not come from our own origin and our own frame.
      if (event.origin !== expectedOrigin || event.source !== iframe.contentWindow) {
        return
      }
      const data = event.data as SandboxOutboundMessage | null
      if (!data || data.channel !== SANDBOX_CHANNEL || data.kind !== 'ready') {
        return
      }
      stopWaiting()
      if (!iframe.contentWindow) {
        // Tear the orphaned node down so a retry can append a fresh frame without piling up.
        iframe.remove()
        clearActiveFrame(frameId)
        reject(new Error('Sandbox iframe has no content window'))
        return
      }
      resolve({
        element: iframe,
        id: frameId,
        url: iframeUrl,
        window: iframe.contentWindow,
      })
    }

    iframe.addEventListener('error', () => {
      stopWaiting()
      // Drop the broken iframe from the DOM. Without this, a transient failure (network blip, bad
      // bundle path, etc.) leaves a dead `<iframe>` attached, and every retry appends another one,
      // growing the DOM unboundedly across the session.
      iframe.remove()
      clearActiveFrame(frameId)
      reject(new Error('Failed to load the script sandbox iframe'))
    })

    // Catch the silent failure mode the `error` event cannot see: the document loaded but its
    // script never announced readiness. Drop the dead frame and clear the cache so the next call
    // retries with a fresh iframe instead of awaiting this one forever.
    readyTimeoutId = setTimeout(() => {
      window.removeEventListener('message', onReady)
      iframe.remove()
      clearActiveFrame(frameId)
      reject(new Error(`Sandbox iframe did not report readiness within ${SANDBOX_READY_TIMEOUT_MS}ms`))
    }, SANDBOX_READY_TIMEOUT_MS)

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
    .then((sandboxFrame) => {
      assertSandboxFrameLocation(sandboxFrame)

      const frame = sandboxFrame.window
      const { receive: expectedOrigin, send: targetOrigin } = getSandboxOrigins()

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
      // Pin the target origin for web origins. `file://` is the only exception: Chromium does not
      // accept it as a target origin, so Electron file builds use `'*'` and rely on the source-window
      // checks above for receive-side isolation.
      frame.postMessage(request, targetOrigin)
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

/**
 * Eagerly creates the sandbox iframe so the first script execution does not pay the cold-start
 * cost of loading `sandbox.html` and the `postman-sandbox` bundle (noticeably slow on Electron).
 *
 * This is a best-effort optimization: it only runs in a DOM context, reuses the same module-cached
 * frame {@link executeInPostmanSandbox} later awaits, and swallows failures so a warm-up problem can
 * never surface to the caller — the real execution path retries and reports errors on its own.
 *
 * Call this only when scripts are actually present; warming the sandbox for a request without
 * scripts would defeat the lazy creation that keeps script-free requests cheap.
 */
export const prewarmSandboxFrame = (): void => {
  if (typeof document === 'undefined') {
    return
  }

  ensureSandboxFrame().catch(() => {
    // Ignored on purpose: warm-up is opportunistic and the execution path handles real errors.
  })
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
