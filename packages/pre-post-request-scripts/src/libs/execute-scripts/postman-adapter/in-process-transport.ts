import { setSandboxTransport } from './sandbox-adapter'
import { runSandboxExecution } from './sandbox-frame-server'

/**
 * Routes the host adapter to run scripts in-process via {@link runSandboxExecution} instead of an
 * iframe. Used by node tests so the real postman-sandbox pipeline (which needs no DOM in node) can be
 * exercised end-to-end. Never call this in production: it pulls `postman-sandbox` into the host.
 */
export const registerInProcessSandbox = (): void => {
  setSandboxTransport((request, onMessage) => {
    void runSandboxExecution(request, onMessage)
  })
}
