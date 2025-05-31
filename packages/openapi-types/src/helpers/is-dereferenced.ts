import type { OpenAPIV3_1 } from '../openapi-types'

/**
 * Type guard to check if an object is not a ReferenceObject.
 * A ReferenceObject is defined by having a $ref property that is a string.
 */
export const isDereferenced = <T>(obj: T | OpenAPIV3_1.ReferenceObject): obj is T =>
  typeof obj === 'object' &&
  obj !== null &&
  !('$ref' in obj && typeof (obj as OpenAPIV3_1.ReferenceObject).$ref === 'string')
