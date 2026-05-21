import { startSandboxFrameServer } from './sandbox-frame-server'

/**
 * Entry point loaded by the sandbox iframe host page (`sandbox.html`).
 *
 * Importing this module pulls in `postman-sandbox`, so it must only ever be loaded inside the sandbox
 * iframe (which has its own permissive CSP) — never from the main application bundle.
 */
startSandboxFrameServer()
