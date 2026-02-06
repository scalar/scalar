import { convert } from '@scalar/postman-to-openapi'

/**
 * Converts a Postman collection JSON string to an OpenAPI specification document.
 *
 * This function transforms a Postman collection into a valid OpenAPI 3.1 document
 * that can be used throughout the application. The convert function handles parsing
 * and transformation internally.
 *
 * Returns null if the conversion fails due to invalid Postman collection structure
 */
export const getOpenApiFromPostman = (postmanJson: string) => {
  try {
    // The convert function accepts a string and handles parsing internally
    return convert(postmanJson)
  } catch {
    return null
  }
}
