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
export const getRegistryErrorStatusCode = (error: unknown): number | undefined => {
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
