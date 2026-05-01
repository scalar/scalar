import { toIpcRequest } from './to-ipc-request'
import { toWebResponse } from './to-web-response'
import type { Transport } from './types'

/**
 * Create a fetch function that delegates the actual HTTP request to the
 * provided `transport`.  In production the transport is `window.api.customFetch`
 * (the IPC bridge to the Node.js main process); in tests it can be any mock.
 *
 * The factory handles all browser-side serialization (body → ArrayBuffer,
 * `RequestInfo` flattening), header transforms (x-scalar-cookie → Cookie, etc.),
 * and response reconstruction.
 */
export const createCustomFetch =
  (transport: Transport) =>
  async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const ipcRequest = await toIpcRequest(input, init)
    const result = await transport(ipcRequest)
    return toWebResponse(result)
  }
