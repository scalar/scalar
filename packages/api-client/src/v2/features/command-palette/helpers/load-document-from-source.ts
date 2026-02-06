import { normalize } from '@scalar/openapi-parser'
import type { UnknownObject } from '@scalar/types/utils'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { getOpenApiFromPostman } from '@/v2/features/command-palette/helpers/get-openapi-from-postman'
import { isPostmanCollection } from '@/v2/features/command-palette/helpers/is-postman-collection'
import { isUrl } from '@/v2/helpers/is-url'

/**
 * Attempts to add a document to the workspace from a given source, which may be a URL or raw content.
 *
 * - If the source is a URL, adds the document by its URL and includes a watch mode flag as metadata.
 * - If the source is a Postman collection, transforms it to OpenAPI and adds it as a document.
 * - For other raw sources (such as pasted JSON or YAML), attempts to normalize and add them as a document.
 *
 * @param workspaceStore The workspace store where the document will be added.
 * @param source The document source (URL, Postman Collection, JSON, or YAML string).
 * @param name The display name for the new document.
 * @param watchMode Whether to enable watch mode (applies only to URL sources).
 * @returns Promise resolving to true if the document was successfully added, or false if the operation failed.
 */
export const loadDocumentFromSource = async (
  workspaceStore: WorkspaceStore,
  source: string | null,
  name: string,
  watchMode: boolean,
): Promise<boolean> => {
  if (!source) {
    // No source provided, do nothing.
    return false
  }

  // If the source is a URL, add it directly with watch mode metadata.
  if (isUrl(source)) {
    return await workspaceStore.addDocument({
      name,
      url: source,
      meta: {
        'x-scalar-watch-mode': watchMode,
      },
    })
  }

  // Handle Postman Collection: convert to OpenAPI and add as document.
  if (isPostmanCollection(source)) {
    const document = getOpenApiFromPostman(source)

    if (document === null) {
      return false
    }

    return await workspaceStore.addDocument({ name, document })
  }

  const getNormalizedContent = (source: string) => {
    try {
      return normalize(source) as UnknownObject
    } catch (error) {
      console.error(error)
      return null
    }
  }

  // For other sources, try to normalize as JSON/YAML/OpenAPI.
  const normalizedContent = getNormalizedContent(source)

  if (normalizedContent === null) {
    // Normalization failed, unable to add document.
    return false
  }

  return await workspaceStore.addDocument({
    name,
    document: normalizedContent,
  })
}
