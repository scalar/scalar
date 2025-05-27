import { OpenApiVersions } from '@/configuration'
import type { DetailsResult } from '@/types/index'
import { isObject } from './is-object'

/**
 * Get versions of the OpenAPI document.
 */
export function details(specification: unknown): DetailsResult {
  if (specification === null) {
    return {
      version: undefined,
      specificationType: undefined,
      specificationVersion: undefined,
    }
  }

  if (isObject(specification)) {
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
  }

  return {
    version: undefined,
    specificationType: undefined,
    specificationVersion: undefined,
  }
}
