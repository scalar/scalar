import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { ExternalDocumentationObject, TagObject } from '@/schemas/v3.2/strict/openapi-document'

/** Navigation is cloned and persisted, so keep documentation as plain display metadata. */
export const getTagExternalDocs = (tag: TagObject): ExternalDocumentationObject | undefined => {
  const documentation = getResolvedRef(tag.externalDocs)
  return documentation ? { url: documentation.url, description: documentation.description } : undefined
}
