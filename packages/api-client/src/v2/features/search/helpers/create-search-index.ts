import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type { FuseData } from '@/v2/features/search/types'

/**
 * Create a search index from a list of entries.
 */
export function createSearchIndex(documents: OpenApiDocument[]): FuseData[] {
  const index: FuseData[] = []

  /**
   * Recursively processes entries and their children to build the search index.
   */
  function processEntries(entriesToProcess: TraversedEntry[], document?: OpenApiDocument): void {
    entriesToProcess.forEach((entry) => {
      addEntryToIndex(entry, index, document)

      // Recursively process children if they exist
      if ('children' in entry && entry.children) {
        processEntries(entry.children, document)
      }
    })
  }

  documents?.forEach((document) => processEntries(document['x-scalar-navigation']?.children ?? [], document))

  return index
}

/**
 * Adds a single entry to the search index, handling all entry types recursively.
 */
function addEntryToIndex(entry: TraversedEntry, index: FuseData[], document?: OpenApiDocument): void {
  // Operation
  if (entry.type === 'operation') {
    const operation = getResolvedRef(document?.paths?.[entry.path]?.[entry.method]) ?? {}

    index.push({
      type: 'operation',
      title: entry.title,
      id: entry.id,
      description: operation.description || '',
      method: entry.method,
      path: entry.path,
      operationId: operation.operationId,
      entry,
      documentName: document?.info.title ?? '',
    })

    return
  }

  if (entry.type === 'tag' && entry.isGroup === false) {
    index.push({
      id: entry.id,
      title: entry.title,
      description: entry.description || '',
      type: 'tag',
      entry,
      documentName: document?.info.title ?? '',
    })

    return
  }

  // Tag group
  if (entry.type === 'tag' && entry.isGroup === true) {
    index.push({
      id: entry.id,
      title: entry.title,
      description: 'Tag Group',
      type: 'tag',
      entry,
      documentName: document?.info.title ?? '',
    })

    return
  }

  // Headings from info.description
  if (entry.type === 'text') {
    index.push({
      id: entry.id,
      type: 'heading',
      title: entry.title ?? '',
      description: 'Heading',
      entry,
      documentName: document?.info.title ?? '',
    })

    return
  }
}
