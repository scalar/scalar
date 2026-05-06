/**
 * Reads the HTTP status code off a thrown SDK error so the registry
 * adapters can map it onto our discriminated error union.
 *
 * The Scalar SDK exposes the HTTP response on `error.httpMeta.response`
 * for every `ScalarError` subclass (the generic `APIError` returned for
 * unmatched 4XX/5XX responses, plus the per-status `FourHundred`,
 * `FourHundredAndOne`, ... classes). Older SDK builds put `statusCode`
 * directly on the error, so we keep a fallback for that shape to stay
 * compatible while consumers upgrade.
 *
 * Returns `undefined` for non-HTTP errors (e.g. network or abort errors)
 * so callers can treat that case as "request never reached the server".
 */
const getRegistryErrorStatusCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  const candidate = error as {
    statusCode?: unknown
    httpMeta?: { response?: { status?: unknown } }
  }

  const fromHttpMeta = candidate.httpMeta?.response?.status
  if (typeof fromHttpMeta === 'number') {
    return fromHttpMeta
  }

  if (typeof candidate.statusCode === 'number') {
    return candidate.statusCode
  }

  return undefined
}

/**
 * Codes every registry adapter emits without having to opt in. The
 * shared mapper produces these unconditionally so concrete adapters
 * only have to spell out the status codes that matter for their
 * recovery UI (e.g. `404 → NOT_FOUND`, `409 → CONFLICT`).
 */
type BaseRegistryErrorCode = 'UNAUTHORIZED' | 'FETCH_FAILED' | 'UNKNOWN'

/**
 * Maps a thrown SDK error onto the discriminated error union the
 * registry adapters surface to the API client. Centralising the
 * cascade here means the `UNAUTHORIZED` / `FETCH_FAILED` / `UNKNOWN`
 * branches stay in lockstep across `fetchDocument`, `publishDocument`,
 * `publishVersion`, `deleteVersion`, and `deleteDocument` - the
 * registry treats those branches the same way for every endpoint, and
 * we want a fix in one to flow to the rest automatically.
 *
 * The cascade runs in priority order:
 *
 * 1. 401 / 403 → `UNAUTHORIZED` so the host can prompt sign-in.
 * 2. Any caller-supplied `statusCodes` mapping (e.g. `404 → NOT_FOUND`,
 *    `409 → CONFLICT`). Checked before the 5xx fallback so non-5xx
 *    extras win over the network bucket.
 * 3. ≥500 → `FETCH_FAILED` for transient registry failures.
 * 4. Missing status code → `FETCH_FAILED` because the request never
 *    reached the registry (network drop, CORS, abort).
 * 5. Anything else → `UNKNOWN`, surfaced with the original message so
 *    the user gets at least one hint about what went wrong.
 *
 * @param error - The value thrown by the SDK call.
 * @param options.statusCodes - Per-endpoint status-code mappings layered
 *   between the universal authorization and 5xx branches. Keys are
 *   numeric HTTP statuses, values are the discriminated error codes the
 *   adapter wants to surface.
 * @param options.fallbackMessage - Message to use when the thrown value
 *   is not an `Error` instance. Defaults to `undefined`; only the fetch
 *   adapter currently opts into a custom fallback.
 */
export const mapRegistryError = <E extends string = never>(
  error: unknown,
  options: {
    statusCodes?: Partial<Record<number, E>>
    fallbackMessage?: string
  } = {},
): {
  ok: false
  error: E | BaseRegistryErrorCode
  message?: string
} => {
  const statusCode = getRegistryErrorStatusCode(error)
  const message = error instanceof Error ? error.message : options.fallbackMessage

  if (statusCode === 401 || statusCode === 403) {
    return { ok: false, error: 'UNAUTHORIZED', message }
  }

  if (statusCode !== undefined) {
    const extra = options.statusCodes?.[statusCode]
    if (extra !== undefined) {
      return { ok: false, error: extra, message }
    }
  }

  if (typeof statusCode === 'number' && statusCode >= 500) {
    return { ok: false, error: 'FETCH_FAILED', message }
  }

  // No status code at all means the request never reached the registry
  // (network drop, CORS, abort). Treat the same as a 5xx so the caller
  // shows the network-flavoured toast instead of a generic "unknown".
  if (statusCode === undefined) {
    return { ok: false, error: 'FETCH_FAILED', message }
  }

  return { ok: false, error: 'UNKNOWN', message }
}
