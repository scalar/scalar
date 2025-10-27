import { iterateTitle } from '@scalar/helpers/string/iterate-title'
import type { ObjectDoc, UrlDoc } from '@scalar/workspace-store/client'
import type { OpenApiDocument, InfoObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Calculate a default name for the document to make the workspace store name parameter optional
 *
 * @param params.name - If we have a name already, like config.slug
 * @param params.url - URL of the document
 * @param params.document - The document object
 * @param documents - Optional documents record which will automatically iterate the title if we have a duplicate
 * @returns The name of the document
 */
export const getDocumentName = (
  { name, url, document }: Partial<UrlDoc> & Partial<ObjectDoc> = {},
  documents?: Record<string, OpenApiDocument>,
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

  // If we cannot resolve a name, we iterate over the documens in case of a conflict
  if (documents) {
    const names = Object.keys(documents)
    return iterateTitle('API #1', (t) => names.some((name) => name === t))
  }

  // Otherwise we just default
  return 'default'
}
