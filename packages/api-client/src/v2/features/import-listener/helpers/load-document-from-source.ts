import { normalize } from '@scalar/openapi-parser'
import type { UnknownObject } from '@scalar/types/utils'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { isUrl } from '@/v2/helpers/is-url'

/**
 * Loads a document from a given source (URL or raw content) and adds it to the workspace.
 *
 * - If the source is a URL, adds the document from the URL and enables/disables watch mode as requested.
 * - If the source is raw content (like pasted JSON/YAML), normalizes and adds it as a document.
 *
 * @param workspaceStore The workspace store to add the document to
 * @param source The source to load the document from (URL or raw content)
 * @param name The name of the document
 * @param watchMode Whether to enable watch mode for URL sources
 * @returns Promise resolving to true if the document is added successfully, false otherwise
 */
export const loadDocumentFromSource = async (
  workspaceStore: WorkspaceStore,
  source: string | null,
  name: string,
  watchMode: boolean,
): Promise<boolean> => {
  if (!source) {
    // Return false if no source is provided
    return false
  }

  if (isUrl(source)) {
    // Add document by URL, with optional watch mode metadata
    return await workspaceStore.addDocument({
      name,
      url: source,
      meta: {
        'x-scalar-watch-mode': watchMode,
      },
    })
  }

  const getNormalizedContent = (source: string) => {
    try {
      return normalize(source) as UnknownObject
    } catch (error) {
      console.error(error)
      return null
    }
  }

  // For raw string sources (file content or pasted YAML/JSON), normalize before adding
  const normalizedContent = getNormalizedContent(source)

  if (normalizedContent === null) {
    return false
  }

  return await workspaceStore.addDocument({
    name,
    document: normalizedContent,
  })
}
