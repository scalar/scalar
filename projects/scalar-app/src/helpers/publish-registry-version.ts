import type { RegistryAdapter } from '@scalar/api-client/v2/features/app'

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
export const publishRegistryVersion: PublishRegistryVersion = async ({ namespace, slug, version, document }) => {
  try {
    const result = await scalarClient.registry.createApiDocumentVersion({
      namespace,
      slug,
      requestBody: {
        version,
        document: JSON.stringify(document),
      },
    })

    return {
      ok: true,
      data: { namespace, slug, version, commitHash: result.versionSha ?? '' },
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
 */
const mapPublishVersionError = (
  error: unknown,
): {
  ok: false
  error: 'CONFLICT' | 'NOT_FOUND' | 'FETCH_FAILED' | 'UNAUTHORIZED' | 'UNKNOWN'
  message?: string
} => {
  const statusCode = (error as { statusCode?: number }).statusCode
  const message = error instanceof Error ? error.message : undefined

  if (statusCode === 401 || statusCode === 403) {
    return { ok: false, error: 'UNAUTHORIZED', message }
  }

  if (statusCode === 404) {
    return { ok: false, error: 'NOT_FOUND', message }
  }

  if (statusCode === 409 || statusCode === 422) {
    return { ok: false, error: 'CONFLICT', message }
  }

  if (typeof statusCode === 'number' && statusCode >= 500) {
    return { ok: false, error: 'FETCH_FAILED', message }
  }

  if (statusCode === undefined) {
    return { ok: false, error: 'FETCH_FAILED', message }
  }

  return { ok: false, error: 'UNKNOWN', message }
}
