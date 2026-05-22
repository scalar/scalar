import { isObject } from '@scalar/helpers/object/is-object'
import type { UnknownObject } from '@scalar/types/utils'

/** The AsyncAPI version produced by this upgrade step. */
const ASYNCAPI_VERSION = '3.1.0'

/**
 * Upgrade an AsyncAPI 3.0 document to 3.1.0.
 *
 * For now this only bumps the `asyncapi` version string — no structural
 * transformations are applied yet.
 */
export function upgradeFromThreeToThreeOne(originalDocument: UnknownObject): UnknownObject {
  const document = originalDocument

  // Skip anything that is not an AsyncAPI 3.0 document
  if (!isObject(document) || typeof document.asyncapi !== 'string' || !document.asyncapi.startsWith('3.0')) {
    return document
  }

  document.asyncapi = ASYNCAPI_VERSION

  return document
}
