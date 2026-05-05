import type { Transport } from './types'

/**
 * Build a `Transport` that routes through the Electron IPC bridge.
 *
 * For standard buffered responses (non-SSE) the IpcFetchResponse is returned
 * as-is — the body is an `ArrayBuffer`.
 *
 * For streaming responses the main process returns `streamId` and a null body,
 * then emits `customFetch:data` / `customFetch:end` / `customFetch:error` IPC
 * events.  This function reconstructs a `ReadableStream<Uint8Array>` from those
 * events so that callers can consume SSE incrementally.
 */
export const createIpcTransport = (): Transport => async (request) => {
  const result = await window.api.customFetch(request)

  if (!result.streamId) {
    return result
  }

  const { streamId } = result
  // `done` is hoisted so `cancel()` can flip it and block any further
  // `controller.enqueue()` calls from in-flight IPC `customFetch:data` events.
  // Without this, chunks that arrive between the consumer cancelling the stream
  // and the main process actually aborting would throw
  // "Cannot enqueue a chunk into a closed readable stream".
  let done = false
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      window.api.customFetchStream({
        streamId,
        callbacks: {
          onData: (chunk) => {
            if (done) {
              return
            }
            try {
              controller.enqueue(new Uint8Array(chunk))
            } catch {
              // Defensive: the controller may have been closed by a cancel()
              // that hasn't yet propagated through `done`.  Swallow rather
              // than surface a noisy error to the renderer console.
              done = true
            }
          },
          onEnd: () => {
            if (!done) {
              done = true
              controller.close()
            }
          },
          onError: (message) => {
            if (!done) {
              done = true
              controller.error(new Error(message))
            }
          },
        },
      })
    },
    cancel() {
      // Cancelling the ReadableStream means the caller no longer wants data.
      // Flip `done` synchronously so queued `onData` callbacks stop enqueueing,
      // then abort via the request's abortId (if present) to also cancel the
      // underlying undici connection.
      done = true
      if (request.abortId) {
        window.api.customFetchAbort(request.abortId)
      }
    },
  })

  return { ...result, body: stream }
}
