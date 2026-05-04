import type { RegistryAdapter } from '@scalar/api-client/v2/features/app'

import { getRegistryErrorStatusCode } from './registry-error-status'
import { scalarClient } from './scalar-client'

type DeleteRegistryVersion = RegistryAdapter['deleteVersion']

/**
 * Removes a single version of an existing registry document.
 *
 * The registry does not perform optimistic concurrency on the delete
 * endpoint, so the caller does not forward a commit hash - the
 * deletion is unconditional once authorization succeeds.
 */
export const deleteRegistryVersion: DeleteRegistryVersion = async ({ namespace, slug, version }) => {
  try {
    await scalarClient.registry.deleteApiDocumentVersion({
      namespace,
      slug,
      semver: version,
    })

    return {
      ok: true,
      data: { namespace, slug, version },
    }
  } catch (error) {
    return mapDeleteVersionError(error)
  }
}

/**
 * Maps a thrown SDK error onto the discriminated error codes the
 * danger-zone delete flow switches on. Mirrors the document-wide
 * delete mapper - the registry treats per-version and group-wide
 * deletes the same way (no concurrency check, just authorization +
 * existence) so the error space is identical.
 */
const mapDeleteVersionError = (
  error: unknown,
): {
  ok: false
  error: 'NOT_FOUND' | 'FETCH_FAILED' | 'UNAUTHORIZED' | 'UNKNOWN'
  message?: string
} => {
  const statusCode = getRegistryErrorStatusCode(error)
  const message = error instanceof Error ? error.message : undefined

  if (statusCode === 401 || statusCode === 403) {
    return { ok: false, error: 'UNAUTHORIZED', message }
  }

  if (statusCode === 404) {
    return { ok: false, error: 'NOT_FOUND', message }
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
