import { isObject } from '@scalar/helpers/object/is-object'

import { type AsyncApiVersion, AsyncApiVersions } from '@/specifications'

/**
 * Detects the AsyncAPI version of a document by reading its top-level `asyncapi`
 * field (an exact version string like `"3.0.0"`).
 *
 * Returns the version only when a matching schema is available, otherwise
 * `undefined`.
 */
export function detectVersion(document: unknown): AsyncApiVersion | undefined {
  if (!isObject(document)) {
    return undefined
  }

  const version = document.asyncapi

  if (typeof version === 'string' && (AsyncApiVersions as string[]).includes(version)) {
    return version as AsyncApiVersion
  }

  return undefined
}
