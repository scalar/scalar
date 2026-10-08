import type { AsyncApiInfoObject } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ExternalDocumentationObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Resolve documentation links on an object and its tags, in display order. */
export const getExternalDocumentation = (
  owner: Pick<AsyncApiInfoObject, 'externalDocs' | 'tags'> | undefined,
): ExternalDocumentationObject[] => {
  const direct = getResolvedRef(owner?.externalDocs)
  const tags =
    owner?.tags?.flatMap((tag) => {
      const documentation = getResolvedRef(getResolvedRef(tag)?.externalDocs)
      return documentation?.url ? [documentation] : []
    }) ?? []
  return [...(direct?.url ? [direct] : []), ...tags]
}
