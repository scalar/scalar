import type { RegistryAdapter } from '@/types/configuration'

import { mapRegistryError } from './registry-error-status'
import { scalarClient } from './scalar-client'

type PublishRegistryDocument = RegistryAdapter['publishDocument']

/**
 * Publishes a brand-new document to the Scalar registry under the given
 * namespace and slug.
 *
 * The registry's HTTP surface returns the standard `ScalarError` family
 * with a `statusCode` field, so we delegate to {@link mapRegistryError}
 * to translate the throw into the discriminated error union expected by
 * the API client adapter. The only endpoint-specific status here is
 * 409, which the registry uses for slug collisions when creating a new
 * document - 422 stays on the validation track and falls through to
 * `UNKNOWN`.
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
    return mapRegistryError(error, { statusCodes: { 409: 'CONFLICT' } })
  }
}
