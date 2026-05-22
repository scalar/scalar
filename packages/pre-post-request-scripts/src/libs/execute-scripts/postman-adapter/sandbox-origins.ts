type SandboxOriginConfig = {
  receive: string
  send: string
}

/**
 * Origin pair used for sandbox `postMessage` exchanges.
 *
 * Chromium reports `file://` message origins as `'null'` and rejects `file://` as a target origin,
 * so packaged Electron builds must receive from `'null'` and send with `'*'`. Other schemes stay
 * pinned to their exact origin to avoid leaking script payloads or accepting spoofed messages.
 */
export const getSandboxOrigins = (): SandboxOriginConfig => {
  const { origin, protocol } = window.location
  const isFileProtocol = protocol === 'file:' || origin === 'file://'

  if (isFileProtocol) {
    return {
      receive: 'null',
      send: '*',
    }
  }

  return {
    receive: origin,
    send: origin,
  }
}
