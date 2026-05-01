import type { RegistryAdapter } from '@scalar/api-client/v2/features/app'
import { isObject } from '@scalar/helpers/object/is-object'

import { scalarClient } from './scalar-client'

type ImportDocumentFromRegistry = RegistryAdapter['fetchDocument']

/**
 * Fetches a document from the Scalar registry by meta.
 *
 * The registry returns the document body as a JSON string, so we parse
 * it back into an object before handing it to the workspace store. SDK
 * errors carry an HTTP `statusCode`, which we map onto the discriminated
 * error union the API client switches on.
 */
export const fetchRegistryDocument: ImportDocumentFromRegistry = async ({ namespace, slug, version = 'latest' }) => {
  try {
    const documentString = await scalarClient.registry.getApiDocumentVersion({
      namespace,
      slug,
      semver: version,
    })

    const document = JSON.parse(documentString)
    if (!document || !isObject(document)) {
      return { ok: false, error: 'UNKNOWN', message: 'Cannot parse document from registry' }
    }

    // TODO: use the actual version hash here once the sdk is updated
    return { ok: true, data: { document, versionSha: 'some-version-sha' } }
  } catch (error) {
    return mapFetchRegistryDocumentError(error)
  }
}

/**
 * Maps a thrown SDK error onto the discriminated error codes the document
 * sync flow reads. Falls back to `UNKNOWN` so callers can still surface a
 * meaningful message even when the status code does not match a dedicated
 * branch.
 */
const mapFetchRegistryDocumentError = (
  error: unknown,
): {
  ok: false
  error: 'NOT_FOUND' | 'FETCH_FAILED' | 'UNAUTHORIZED' | 'UNKNOWN'
  message?: string
} => {
  const statusCode = (error as { statusCode?: number }).statusCode
  const message = error instanceof Error ? error.message : `Cannot load document from registry: ${String(error)}`

  if (statusCode === 401 || statusCode === 403) {
    return { ok: false, error: 'UNAUTHORIZED', message }
  }

  if (statusCode === 404) {
    return { ok: false, error: 'NOT_FOUND', message }
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
