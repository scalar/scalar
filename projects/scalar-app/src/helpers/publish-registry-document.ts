import type { RegistryAdapter } from '@scalar/api-client/v2/features/app'

import { getRegistryErrorStatusCode } from './registry-error-status'
import { scalarClient } from './scalar-client'

type PublishRegistryDocument = RegistryAdapter['publishDocument']

/**
 * Publishes a brand-new document to the Scalar registry under the given
 * namespace and slug.
 *
 * The registry's HTTP surface returns the standard `ScalarError` family
 * with a `statusCode` field, so we map status codes to the discriminated
 * error union expected by the API client adapter.
 *
 * The OpenAPI document body is sent as a JSON string because the registry
 * API stores it as text; we also lift `info.title` onto the request so the
 * registry has a human-readable label without needing to parse the
 * document upstream.
 */
export const publishRegistryDocument: PublishRegistryDocument = async ({ namespace, slug, version, document }) => {
  const info = (document as { info?: { title?: unknown; description?: unknown } }).info
  const title = typeof info?.title === 'string' && info.title.trim().length > 0 ? info.title : slug
  const description = typeof info?.description === 'string' ? info.description : undefined

  try {
    const result = await scalarClient.registry.createApiDocument({
      namespace,
      requestBody: {
        title,
        description,
        version,
        slug,
        document: JSON.stringify(document),
      },
    })

    return {
      ok: true,
      data: { namespace, slug, version, commitHash: result.object?.versionSha },
    }
  } catch (error) {
    return mapPublishDocumentError(error)
  }
}

/**
 * Maps a thrown SDK error onto the discriminated error codes the API
 * client publish modal switches on. Falls back to `UNKNOWN` so callers
 * always see the original message in a toast even when the status code
 * cannot be mapped to a dedicated branch.
 */
const mapPublishDocumentError = (
  error: unknown,
): {
  ok: false
  error: 'CONFLICT' | 'FETCH_FAILED' | 'UNAUTHORIZED' | 'UNKNOWN'
  message?: string
} => {
  const statusCode = getRegistryErrorStatusCode(error)
  const message = error instanceof Error ? error.message : undefined

  if (statusCode === 401 || statusCode === 403) {
    return { ok: false, error: 'UNAUTHORIZED', message }
  }

  // 409 is the standard status for a slug collision when creating a new
  // registry document; 422 stays on the validation track instead.
  if (statusCode === 409) {
    return { ok: false, error: 'CONFLICT', message }
  }

  if (typeof statusCode === 'number' && statusCode >= 500) {
    return { ok: false, error: 'FETCH_FAILED', message }
  }

  // No status code at all usually means a network/connection failure
  // that never reached the registry.
  if (statusCode === undefined) {
    return { ok: false, error: 'FETCH_FAILED', message }
  }

  return { ok: false, error: 'UNKNOWN', message }
}
