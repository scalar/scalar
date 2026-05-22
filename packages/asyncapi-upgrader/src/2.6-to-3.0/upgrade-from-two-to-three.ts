import { isObject } from '@scalar/helpers/object/is-object'
import type { UnknownObject } from '@scalar/types/utils'

/** The AsyncAPI version produced by this upgrade step. */
const ASYNCAPI_VERSION = '3.0.0'

/**
 * Upgrade an AsyncAPI 2.x document to 3.0.0.
 *
 * For now this only bumps the `asyncapi` version string — no structural
 * transformations are applied yet.
 */
export function upgradeFromTwoToThree(originalDocument: UnknownObject): UnknownObject {
  const document = originalDocument

  // Skip anything that is not an AsyncAPI 2.x document
  if (!isObject(document) || typeof document.asyncapi !== 'string' || !document.asyncapi.startsWith('2.')) {
    return document
  }

  document.asyncapi = ASYNCAPI_VERSION

  return document
}
