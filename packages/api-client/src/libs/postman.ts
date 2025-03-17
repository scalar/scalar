import { convert } from '@scalar/postman-to-openapi'

/** Checks if the given content is a Postman collection */
export function isPostmanCollection(content: string): boolean {
  try {
    const parsed = JSON.parse(content)
    const isPostman =
      parsed.info?._postman_id !== undefined && new URL(parsed.info?.schema).host === 'schema.getpostman.com'
    return isPostman
  } catch (_error) {
    return false
  }
}

/** Converts a Postman collection JSON string to an OpenAPI JSON string */
export async function convertPostmanToOpenApi(postmanJson: string): Promise<string> {
  try {
    const postmanCollection = JSON.parse(postmanJson)
    const openApiDoc = convert(postmanCollection)
    return JSON.stringify(openApiDoc, null, 2)
  } catch (_error) {
    throw new Error('Failed to convert Postman collection to OpenAPI')
  }
}

/** Extracts details from a Postman collection JSON string */
export function getPostmanDocumentDetails(content: string): {
  type: string
  title: string
  version: string
} | null {
  try {
    if (isPostmanCollection(content)) {
      const parsed = JSON.parse(content)
      return {
        type: 'json',
        title: parsed.info?.name || 'Postman Collection',
        version: parsed.info?.version || '1.0',
      }
    }
    return null
  } catch {
    return null
  }
}
