import type { RegistryAdapter } from '@scalar/api-client/v2/features/app'

import { getRegistryErrorStatusCode } from './registry-error-status'
import { scalarClient } from './scalar-client'

type PublishRegistryVersion = RegistryAdapter['publishVersion']

/**
 * Publishes a new version of an existing registry document.
 *
 * The registry currently does not expose an explicit optimistic-concurrency
 * field on this endpoint, so the caller's `commitHash` is forwarded but
 * not validated locally - the registry will reject the call with a 409
 * when the upstream hash has moved on.
 */
export const publishRegistryVersion: PublishRegistryVersion = async ({
  namespace,
  slug,
  version,
  document,
  commitHash,
}) => {
  try {
    const result = await scalarClient.registry.createApiDocumentVersion({
      namespace,
      slug,
      requestBody: {
        version,
        document: JSON.stringify(document),
        force: true,
        lastKnownVersionSha: commitHash,
      },
    })

    return {
      ok: true,
      data: { namespace, slug, version, commitHash: result.managedDocVersion?.versionSha ?? '' },
    }
  } catch (error) {
    return mapPublishVersionError(error)
  }
}

/**
 * Maps a thrown SDK error onto the discriminated error codes the document
 * sync flow switches on so the caller can show targeted recovery UI for
 * `CONFLICT` (rebase + retry) versus `NOT_FOUND` (publish first) without
 * string-matching error messages.
 *
 * The registry signals a stale-hash conflict with a 409 response - the
 * standard HTTP status for optimistic-concurrency rejections. We do not
 * lump 422 in with conflicts because the SDK uses 422 for body
 * validation failures, which the user has to fix before retrying rather
 * than pulling upstream changes.
 */
const mapPublishVersionError = (
  error: unknown,
): {
  ok: false
  error: 'CONFLICT' | 'NOT_FOUND' | 'FETCH_FAILED' | 'UNAUTHORIZED' | 'UNKNOWN'
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

  if (statusCode === 409) {
    return { ok: false, error: 'CONFLICT', message }
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
