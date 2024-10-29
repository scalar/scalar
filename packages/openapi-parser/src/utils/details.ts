import { type OpenApiVersion, OpenApiVersions } from '../configuration/index.js'
import type { AnyObject, DetailsResult } from '../types/index.js'

/**
 * Get versions of the OpenAPI specification.
 */
export function details(specification: AnyObject): DetailsResult {
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
