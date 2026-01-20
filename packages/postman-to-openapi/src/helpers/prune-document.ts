import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/**
 * Recursively removes all undefined values from an object or array.
 * Preserves null values as they are valid in JSON/OpenAPI.
 * Returns a new object/array with undefined values removed.
 */
const removeUndefinedValues = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value === null ? null : undefined
  }

  if (Array.isArray(value)) {
    return value.map(removeUndefinedValues).filter((item) => item !== undefined)
  }

  if (typeof value === 'object') {
    const cleaned: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      const cleanedValue = removeUndefinedValues(val)
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue
      }
    }
    return cleaned
  }

  return value
}

/**
 * Prunes an OpenAPI document by removing empty arrays/objects and undefined values.
 * Removes empty tags, security arrays, and empty components objects.
 * Recursively removes all undefined values throughout the document structure.
 */
export const pruneDocument = (document: OpenAPIV3_1.Document): OpenAPIV3_1.Document => {
  const cleaned: OpenAPIV3_1.Document = { ...document }

  if (cleaned.tags?.length === 0) {
    delete cleaned.tags
  }

  if (cleaned.security?.length === 0) {
    delete cleaned.security
  }

  if (cleaned.components && Object.keys(cleaned.components).length === 0) {
    delete cleaned.components
  }

  if (cleaned.externalDocs === undefined) {
    delete cleaned.externalDocs
  }

  // Recursively remove all undefined values from the document
  return removeUndefinedValues(cleaned) as OpenAPIV3_1.Document
}
