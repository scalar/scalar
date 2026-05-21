import type { UnknownObject } from '@scalar/types/utils'

/** The AsyncAPI version produced by this upgrade step. */
const ASYNCAPI_VERSION = '2.6.0'

/**
 * Upgrade an AsyncAPI 1.x document to 2.6.0.
 *
 * For now this only bumps the `asyncapi` version string — no structural
 * transformations are applied yet.
 */
export function upgradeFromOneToTwo(originalDocument: UnknownObject): UnknownObject {
  const document = originalDocument

  // Skip anything that is not an AsyncAPI 1.x document
  if (
    document === null ||
    typeof document !== 'object' ||
    typeof document.asyncapi !== 'string' ||
    !document.asyncapi.startsWith('1.')
  ) {
    return document
  }

  document.asyncapi = ASYNCAPI_VERSION

  return document
}
