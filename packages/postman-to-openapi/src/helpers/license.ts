import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import type { PostmanCollection, Variable } from '@/types'

// Constants for license variable keys
const VARIABLE_KEYS = {
  NAME: 'license.name',
  URL: 'license.url',
} as const

/**
 * Finds a specific variable in the collection by its key
 */
function findVariable(collection: PostmanCollection, key: string): Variable | undefined {
  return collection.variable?.find((v) => v.key === key)
}

/**
 * Processes license information from collection variables.
 * Returns an OpenAPI License Object if the license name is present.
 */
export function processLicense(collection: PostmanCollection): OpenAPIV3_1.LicenseObject | undefined {
  const nameVar = findVariable(collection, VARIABLE_KEYS.NAME)
  if (!nameVar?.value || typeof nameVar.value !== 'string') {
    return undefined
  }

  const urlVar = findVariable(collection, VARIABLE_KEYS.URL)
  return {
    name: nameVar.value,
    ...(urlVar?.value && typeof urlVar.value === 'string' && { url: urlVar.value }),
  }
}
