import { randomUUID } from 'node:crypto'

import { applyRequestHeaderTransforms } from '@electron/helpers/custom-fetch/apply-request-header-transforms'
import { NULL_BODY_STATUSES } from '@electron/helpers/custom-fetch/null-body-statuses'
import type { IpcFetchRequest, IpcFetchResponse } from '@electron/helpers/custom-fetch/types'
import { httpStatusCodes } from '@scalar/helpers/http/http-status-codes'
import { Agent, request as undiciRequest } from 'undici'

/** A persistent Agent so connections are reused and system proxy env vars are ignored. */
const agent = new Agent()

const X_SCALAR_SET_COOKIE = 'x-scalar-set-cookie'

/**
 * Map of in-flight request abort IDs to their AbortControllers.
 * The main process's `customFetchAbort` IPC handler looks up the ID here
 * and calls `.abort()` to cancel the undici request.
 */
export const abortMap = new Map<string, AbortController>()

/**
 * Minimal interface for the Electron WebContents sender, typed narrowly so the
 * function remains testable without importing Electron in unit tests.
 */
export type IpcSender = {
  send(channel: string, ...args: unknown[]): void
  isDestroyed(): boolean
}

/**
 * Execute a fetch request via undici and return a serializable response.
 *
 * Uses `undici.request()` rather than `undici.fetch()` so that GET/HEAD
 * requests with a body are permitted — undici's fetch follows the Fetch spec
 * strictly and would reject them, but the lower-level request API does not.
 *
 * Called from the renderer via IPC so it runs in the Node.js main process,
 * bypassing Chromium's network stack (no CORS, no cookie stripping, no proxy).
 *
 * @param sender - The WebContents of the calling renderer window, required to
 *   stream body chunks for SSE / chunked-transfer responses.  When absent (e.g.
 *   in unit tests for non-streaming paths), streaming is disabled.
 */
export const handleCustomFetch = async (req: IpcFetchRequest, sender?: IpcSender): Promise<IpcFetchResponse> => {
  const ac = new AbortController()
  if (req.abortId) {
    abortMap.set(req.abortId, ac)
  }

  // Idempotent cleanup: removes the AbortController from the map exactly once.
  // For buffered responses it is called inline; for streaming responses the IIFE
  // calls it after the loop finishes so the controller stays available for the
  // full duration of the stream.
  let abortCleaned = false
  const cleanupAbort = () => {
    if (!abortCleaned && req.abortId) {
      abortCleaned = true
      abortMap.delete(req.abortId)
    }
  }

  try {
    // undici.request() is a lower-level API that does not enforce the Fetch spec's
    // "no body on GET/HEAD" rule, which is the primary reason for using it here.
    // Fetch-spec-only options (cache, credentials, mode, etc.) are intentionally
    // omitted — they have no meaning at the raw HTTP layer.
    // Apply the same `x-scalar-*` header transforms the renderer performs. The
    // renderer normally normalizes headers before the IPC hop, so this is
    // defense-in-depth for callers that bypass `toIpcRequest` (future IPC
    // entry points, test harnesses, etc.).
    const outboundHeaders = applyRequestHeaderTransforms(req.headers ?? {})

    const { statusCode, headers, body } = await undiciRequest(req.url, {
      method: req.method ?? 'GET',
      headers: outboundHeaders,
      // ArrayBuffer is not accepted by undici; wrap it in a Buffer so the
      // bytes are handed to undici as a Uint8Array-compatible value.
      body: req.body !== undefined ? Buffer.from(req.body) : undefined,
      dispatcher: agent,
      signal: ac.signal,
    })

    // undici.request() returns headers as Record<string, string | string[]>.
    // Expand array values into individual tuples to preserve multiple Set-Cookie entries.
    const headerEntries: [string, string][] = []
    for (const [key, value] of Object.entries(headers)) {
      if (value === undefined) {
        continue
      }
      if (Array.isArray(value)) {
        for (const v of value) {
          headerEntries.push([key, v])
        }
      } else {
        headerEntries.push([key, value])
      }
    }

    // Mirror all Set-Cookie values into x-scalar-set-cookie so the renderer can
    // read them despite the browser's cross-origin cookie restrictions.
    const setCookieValues = headerEntries.filter(([k]) => k === 'set-cookie').map(([, v]) => v)
    if (setCookieValues.length > 0) {
      headerEntries.push([X_SCALAR_SET_COOKIE, setCookieValues.join(', ')])
    }

    const base: Omit<IpcFetchResponse, 'body'> = {
      status: statusCode,
      // undici.request() does not expose statusText; derive it from the status code.
      statusText: httpStatusCodes[statusCode]?.name ?? '',
      headers: headerEntries,
      // undici.request() does not follow redirects, so the final URL is always
      // the request URL and redirected is always false.
      url: req.url,
      redirected: false,
    }

    // --- Null-body statuses: body must be omitted (Fetch spec §null-body-status) ---
    if (NULL_BODY_STATUSES.has(statusCode)) {
      cleanupAbort()
      return { ...base, body: null }
    }

    // --- Streaming responses: pipe body chunks via IPC events ---
    // Triggers for: SSE, chunked transfer encoding, and media content types
    // (video/*, audio/*) where buffering the full response is impractical.
    const contentType = headerEntries.find(([k]) => k === 'content-type')?.[1] ?? ''
    const transferEncoding = headerEntries.find(([k]) => k === 'transfer-encoding')?.[1] ?? ''
    const isStreaming =
      contentType.includes('text/event-stream') ||
      contentType.startsWith('video/') ||
      contentType.startsWith('audio/') ||
      transferEncoding.toLowerCase() === 'chunked'

    if (isStreaming && sender && !sender.isDestroyed()) {
      const streamId = randomUUID()

      // Stream chunks asynchronously so we can return the headers immediately.
      // The renderer reconstructs a ReadableStream from the IPC events.
      void (async () => {
        try {
          for await (const chunk of body) {
            if (sender.isDestroyed() || ac.signal.aborted) {
              return
            }
            // Slice to obtain a clean, standalone ArrayBuffer — undici's Buffer
            // may be backed by a shared pool allocation.
            const ab = (chunk as Buffer).buffer.slice(
              (chunk as Buffer).byteOffset,
              (chunk as Buffer).byteOffset + (chunk as Buffer).byteLength,
            ) as ArrayBuffer
            sender.send('customFetch:data', { streamId, chunk: ab })
          }
          if (!sender.isDestroyed()) {
            sender.send('customFetch:end', { streamId })
          }
        } catch (err) {
          if (!sender.isDestroyed()) {
            sender.send('customFetch:error', { streamId, message: String(err) })
          }
        } finally {
          // Keep the controller in the map until the stream is fully done so
          // that abort() can be called at any point during streaming.
          cleanupAbort()
        }
      })()

      return { ...base, body: null, streamId }
    }

    // --- Default: buffer body into an ArrayBuffer for a single-shot IPC response ---
    const buffered = { ...base, body: await body.arrayBuffer() }
    cleanupAbort()
    return buffered
  } catch (err) {
    cleanupAbort()
    throw err
  }
}
