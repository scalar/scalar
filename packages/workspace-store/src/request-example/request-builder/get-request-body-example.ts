import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Basically getExample + we generate an example from the schema if no example is found
 */
export const getExampleFromBody = (requestBody: RequestBodyObject, contentType: string, exampleName: string) => {
  const content = requestBody.content?.[contentType]

  if (!content) {
    return null
  }

  return getResolvedRef(content.examples?.[exampleName]) ?? null
}
