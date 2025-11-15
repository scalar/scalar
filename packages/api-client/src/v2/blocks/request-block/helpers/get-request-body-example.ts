import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

export const getExampleFromBody = (requestBody: RequestBodyObject, contentType: string, exampleKey: string) => {
  return getResolvedRef(requestBody.content[contentType]?.examples?.[exampleKey])
}
