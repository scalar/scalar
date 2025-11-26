import { convert } from '@scalar/postman-to-openapi'

/**
 * Converts a Postman collection to an openapi document.
 */
export function getOpenapiFromPostman(postmanJson: string) {
  try {
    const postmanCollection = JSON.parse(postmanJson)
    return convert(postmanCollection)
  } catch (_error) {
    throw new Error('Failed to convert Postman collection to OpenAPI')
  }
}
