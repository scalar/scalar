import type { OpenApiObject as UnprocessedOpenApiObject } from '@scalar/openapi-types/schemas/3.1/unprocessed'
import type { UnknownObject } from '@/types'

/**
 * Returns true if the value is a non-null object (but not an array).
 *
 * @example
 * ```ts
 * isObject({}) // true
 * isObject([]) // false
 * isObject(null) // false
 * ```
 */
export const isObject = (value: unknown): value is UnknownObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** An object which contains a $ref property */
type ReferenceObject = {
  $ref: string
}

/** Type guard for reference objects */
export const isReferenceObject = (value: unknown): value is ReferenceObject =>
  isObject(value) && '$ref' in value && typeof (value as ReferenceObject).$ref === 'string'

/** Type guard to check if an object is a valid OpenAPI/Swagger document */
export const isValidOpenApiDocument = (value: unknown): value is UnprocessedOpenApiObject => {
  if (!isObject(value)) {
    return false
  }

  // Check for OpenAPI
  if (typeof value.openapi === 'string') {
    return true
  }

  // Check for Swagger
  if (typeof value.swagger === 'string') {
    return true
  }

  return false
}
