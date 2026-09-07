/** Limits shared by every remote document loaded through one fetch plugin instance. */
export type RemoteFetchLimits = {
  /** Overall elapsed time from the first load, including DNS and queued requests. Defaults to 10 seconds. */
  timeoutMs: number
  /** Maximum decompressed bytes in one response. Defaults to 5 MiB. */
  maxResponseBytes: number
  /** Maximum decompressed bytes across all responses. Defaults to 20 MiB. */
  maxTotalBytes: number
  /** Maximum remote loads, including the root URL and transitive references. Defaults to 100. */
  maxRequests: number
}

/** Shared accounting and cancellation for a document's remote references. */
export type FetchBudget = {
  start: () => AbortSignal
  consume: (bytes: number, responseBytes: number) => void
}

/** Creates a fresh budget for one bundle operation; generic unguarded plugins do not enable it by default. */
export const createFetchBudget = (options: Partial<RemoteFetchLimits> = {}): FetchBudget => {
  const limits: RemoteFetchLimits = {
    timeoutMs: 10_000,
    maxResponseBytes: 5 * 1024 * 1024,
    maxTotalBytes: 20 * 1024 * 1024,
    maxRequests: 100,
    ...options,
  }
  for (const [key, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value <= 0 || (key === 'timeoutMs' && value > 2_147_483_647)) {
      throw new Error(`Invalid remote fetch limit: ${key}`)
    }
  }
  const controller = new AbortController()
  let deadline: AbortSignal | undefined
  let requests = 0
  let totalBytes = 0
  const fail = (message: string): never => {
    const error = new Error(message)
    controller.abort(error)
    throw error
  }

  return {
    start: (): AbortSignal => {
      deadline ??= AbortSignal.any([controller.signal, AbortSignal.timeout(limits.timeoutMs)])
      deadline.throwIfAborted()
      requests++
      if (requests > limits.maxRequests) {
        fail('Remote reference count limit exceeded')
      }
      return deadline
    },
    consume: (bytes, responseBytes): void => {
      deadline?.throwIfAborted()
      totalBytes += bytes
      if (responseBytes > limits.maxResponseBytes) {
        fail('Remote response byte limit exceeded')
      }
      if (totalBytes > limits.maxTotalBytes) {
        fail('Remote total byte limit exceeded')
      }
    },
  }
}

/** Stops waiting on non-cancellable work such as DNS when the document deadline expires. */
export const withAbort = <T>(promise: Promise<T>, signal: AbortSignal): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const abort = (): void => reject(signal.reason)
    signal.addEventListener('abort', abort, { once: true })
    // Attach both handlers even when already aborted so late DNS/stream failures remain handled.
    promise.then(
      (value) => {
        signal.removeEventListener('abort', abort)
        resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener('abort', abort)
        reject(error)
      },
    )
    if (signal.aborted) {
      signal.removeEventListener('abort', abort)
      abort()
    }
  })
}

type ByteStream = {
  getReader: () => {
    read: () => Promise<{ done: true; value?: Uint8Array } | { done?: false; value: Uint8Array }>
    cancel: () => Promise<void>
  }
}

/** Reads decompressed stream chunks, accounting before retaining each chunk in memory. */
export const readBoundedBody = async (
  body: ByteStream | null,
  budget: FetchBudget,
  signal: AbortSignal,
): Promise<Uint8Array<ArrayBuffer>> => {
  if (!body) {
    return new Uint8Array()
  }
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let bytes = 0
  try {
    while (true) {
      const chunk = await withAbort(reader.read(), signal)
      if (chunk.done) {
        break
      }
      bytes += chunk.value.byteLength
      budget.consume(chunk.value.byteLength, bytes)
      chunks.push(chunk.value)
    }
    const result = new Uint8Array(bytes)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.byteLength
    }
    return result
  } finally {
    // Cancellation may itself wait on an uncooperative custom stream. Do not let it extend the deadline.
    void reader.cancel().catch(() => undefined)
  }
}
