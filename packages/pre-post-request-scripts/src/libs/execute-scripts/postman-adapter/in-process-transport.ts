import { setSandboxTransport } from './sandbox-adapter'
import { runSandboxExecution } from './sandbox-frame-server'
import { SANDBOX_CHANNEL } from './sandbox-protocol'

/**
 * Routes the host adapter to run scripts in-process via {@link runSandboxExecution} instead of an
 * iframe. Used by node tests so the real postman-sandbox pipeline (which needs no DOM in node) can be
 * exercised end-to-end. Never call this in production: it pulls `postman-sandbox` into the host.
 */
export const registerInProcessSandbox = (): void => {
  setSandboxTransport((request, onMessage) => {
    // Mirror the iframe transport: a rejection from `runSandboxExecution` (for example a failed
    // `createContext`) must surface as a `done` message, otherwise the host's awaiting promise
    // in `executeInPostmanSandbox` hangs forever.
    runSandboxExecution(request, onMessage).catch((error: unknown) => {
      onMessage({
        channel: SANDBOX_CHANNEL,
        kind: 'done',
        id: request.id,
        error: error instanceof Error ? error.message : String(error),
      })
    })
  })
}
