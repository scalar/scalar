import type { ObjectDoc, UrlDoc } from '@scalar/workspace-store/client'
import type { InfoObject } from '@scalar/workspace-store/schemas/v3.1/strict/info'

/** Calculate a default name for the document to make the workspace store name parameter optional */
export const getDocumentName = (
  { name, url, document }: Partial<UrlDoc> & Partial<ObjectDoc> = {},
  numOfDocuments: number,
): string => {
  // Check for explicit name first (highest priority)
  if (name) {
    return name
  }

  // Check for URL-based document
  if (url) {
    return url
  }

  // Check for OpenAPI info title
  if (document?.info) {
    const info = document.info as InfoObject
    if (info.title) {
      return info.title
    }
  }

  return `OpenApi Document ${numOfDocuments + 1}`
}
