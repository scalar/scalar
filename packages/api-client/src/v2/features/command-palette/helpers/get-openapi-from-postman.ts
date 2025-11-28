import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { convert } from '@scalar/postman-to-openapi'

/**
 * Converts a Postman collection JSON string to an OpenAPI specification document.
 *
 * This function transforms a Postman collection into a valid OpenAPI 3.1 document
 * that can be used throughout the application. The convert function handles parsing
 * and transformation internally.
 *
 * @throws {Error} When the input is not valid JSON or when the conversion fails
 * due to invalid Postman collection structure
 */
export const getOpenApiFromPostman = (postmanJson: string): OpenAPIV3_1.Document => {
  try {
    // The convert function accepts a string and handles parsing internally
    return convert(postmanJson)
  } catch (error) {
    // Re-throw with a more descriptive error message to help with debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to convert Postman collection to OpenAPI: ${errorMessage}`)
  }
}
