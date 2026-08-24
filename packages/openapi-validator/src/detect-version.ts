import { isObject } from '@scalar/helpers/object/is-object'

import { type OpenApiVersion, OpenApiVersions } from '@/specifications'

/**
 * Detects the OpenAPI/Swagger version of a document by looking at its top-level
 * `openapi` (3.x) or `swagger` (2.0) field.
 *
 * This is an intentionally small, internal copy of the parser's version
 * detection. It is kept private so the validator does not depend on the parser.
 */
export function detectVersion(document: unknown): OpenApiVersion | undefined {
  if (!isObject(document)) {
    return undefined
  }

  for (const version of OpenApiVersions) {
    const field = version === '2.0' ? 'swagger' : 'openapi'
    const value = document[field]

    if (typeof value === 'string' && value.startsWith(version)) {
      return version
    }
  }

  return undefined
}
