import { applyRequestHeaderTransforms } from './apply-request-header-transforms'
import { toArrayBufferBody } from './to-array-buffer-body'
import type { IpcFetchRequest } from './types'

/**
 * Flatten a browser `RequestInfo | URL` and optional `RequestInit` into a
 * serializable `IpcFetchRequest` suitable for transfer over Electron IPC.
 *
 * `AbortSignal` is not serializable, so we generate an `abortId` and register
 * a listener that sends `customFetchAbort(abortId)` when the signal fires.
 * The main process maps the ID to the matching `AbortController`.
 */
export const toIpcRequest = async (input: RequestInfo | URL, init?: RequestInit): Promise<IpcFetchRequest> => {
  const signal = init?.signal ?? (input instanceof Request ? input.signal : null)
  const abortId = signal ? crypto.randomUUID() : undefined
  if (signal && abortId) {
    signal.addEventListener('abort', () => window.api.customFetchAbort(abortId), {
      once: true,
    })
  }

  if (typeof input === 'string' || input instanceof URL) {
    return {
      url: input.toString(),
      method: init?.method,
      headers: applyRequestHeaderTransforms((init?.headers ?? {}) as Record<string, string>),
      body: await toArrayBufferBody(init?.body),
      cache: init?.cache,
      credentials: init?.credentials,
      integrity: init?.integrity,
      keepalive: init?.keepalive,
      mode: init?.mode,
      redirect: init?.redirect,
      referrer: init?.referrer,
      referrerPolicy: init?.referrerPolicy,
      abortId,
    }
  }

  const rawHeaders = (init?.headers ?? Object.fromEntries(input.headers.entries())) as Record<string, string>

  return {
    url: input.url,
    method: init?.method ?? input.method,
    headers: applyRequestHeaderTransforms(rawHeaders),
    body: await toArrayBufferBody(init?.body ?? input.body ?? undefined),
    cache: init?.cache ?? input.cache,
    credentials: init?.credentials ?? input.credentials,
    integrity: init?.integrity ?? input.integrity,
    keepalive: init?.keepalive ?? input.keepalive,
    mode: init?.mode ?? input.mode,
    redirect: init?.redirect ?? input.redirect,
    referrer: init?.referrer ?? input.referrer,
    referrerPolicy: init?.referrerPolicy ?? input.referrerPolicy,
    abortId,
  }
}
