import type { RegistryAdapter } from '@scalar/api-client/v2/features/app'

import { getRegistryErrorStatusCode } from './registry-error-status'
import { scalarClient } from './scalar-client'

type DeleteRegistryDocument = RegistryAdapter['deleteDocument']

/**
 * Removes an entire document group (every version) from the registry.
 *
 * Pairs with {@link deleteRegistryVersion} for the danger-zone "Delete
 * document from registry" flow. The deletion is group-wide so there is
 * no `commitHash` parameter to forward - removing the whole document
 * supersedes any per-version concurrency.
 */
export const deleteRegistryDocument: DeleteRegistryDocument = async ({ namespace, slug }) => {
  try {
    await scalarClient.registry.deleteApiDocument({ namespace, slug })

    return {
      ok: true,
      data: { namespace, slug },
    }
  } catch (error) {
    return mapDeleteDocumentError(error)
  }
}

/**
 * Maps a thrown SDK error onto the discriminated error codes the
 * danger-zone delete flow switches on. There is no `CONFLICT` branch
 * here because the registry rejects per-version concurrency, not
 * group-wide deletes - the worst-case here is a stale listing, which
 * the caller refetches after the delete returns either way.
 */
const mapDeleteDocumentError = (
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
