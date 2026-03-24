import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Retrieve a specific example value from a request body by content type and example name.
 *
 * This looks up the example object using the provided content type and example name,
 * then resolves any $ref using getResolvedRef. If not found, returns null.
 *
 * @param requestBody - The OpenAPI RequestBodyObject
 * @param contentType - The media type for which to find the example (e.g., 'application/json')
 * @param exampleName - The key of the example to retrieve
 * @returns The resolved example value, or null if not found
 */
export const getExampleFromBody = (requestBody: RequestBodyObject, contentType: string, exampleName: string) => {
  const content = requestBody.content?.[contentType]

  if (!content) {
    return null
  }

  return getResolvedRef(content.examples?.[exampleName]) ?? null
}
