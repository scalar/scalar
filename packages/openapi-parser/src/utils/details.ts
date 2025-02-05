import type { UnknownObject } from '@scalar/types/utils'

import { OpenApiVersions } from '../configuration/index.ts'
import type { DetailsResult } from '../types/index.ts'

/**
 * Get versions of the OpenAPI document.
 */
export function details(specification: UnknownObject): DetailsResult {
  if (specification === null) {
    return {
      version: undefined,
      specificationType: undefined,
      specificationVersion: undefined,
    }
  }

  for (const version of new Set(OpenApiVersions)) {
    const specificationType = version === '2.0' ? 'swagger' : 'openapi'
    const value = specification[specificationType]

    if (typeof value === 'string' && value.startsWith(version)) {
      return {
        version: version,
        specificationType,
        specificationVersion: value,
      }
    }
  }

  return {
    version: undefined,
    specificationType: undefined,
    specificationVersion: undefined,
  }
}
