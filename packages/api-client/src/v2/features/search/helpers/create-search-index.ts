import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { TraversedEntry, WithParent } from '@scalar/workspace-store/schemas/navigation'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type { FuseData } from '@/v2/features/search/types'

/**
 * Create a search index from a list of entries.
 */
export function createSearchIndex(documents: OpenApiDocument[]): FuseData[] {
  const index: FuseData[] = []

  /**
   * Recursively processes entries and their children to build the search index.
   * Each entry maintains a reference to its immediate parent.
   */
  function processEntries(
    entriesToProcess: TraversedEntry[],
    document?: OpenApiDocument,
    parent?: WithParent<TraversedEntry>,
  ): void {
    entriesToProcess.forEach((entry) => {
      const entryWithParent = addEntryToIndex(entry, index, document, parent)

      // Recursively process children if they exist
      if ('children' in entry && entry.children) {
        processEntries(entry.children, document, entryWithParent)
      }
    })
  }

  documents?.forEach((document) => processEntries(document['x-scalar-navigation']?.children ?? [], document))

  return index
}

/**
 * Adds a single entry to the search index, handling all entry types recursively.
 * Returns the entry with parent reference for use in recursive calls.
 */
function addEntryToIndex(
  entry: TraversedEntry,
  index: FuseData[],
  document?: OpenApiDocument,
  parent?: WithParent<TraversedEntry>,
): WithParent<TraversedEntry> {
  const entryWithParent: WithParent<TraversedEntry> = parent
    ? { ...entry, parent }
    : (entry as WithParent<TraversedEntry>)
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
      parent,
      documentName: document?.info.title ?? '',
    })

    return entryWithParent
  }

  if (entry.type === 'tag' && entry.isGroup === false) {
    index.push({
      id: entry.id,
      title: entry.title,
      description: entry.description || '',
      type: 'tag',
      entry,
      parent,
      documentName: document?.info.title ?? '',
    })

    return entryWithParent
  }

  // Tag group
  if (entry.type === 'tag' && entry.isGroup === true) {
    index.push({
      id: entry.id,
      title: entry.title,
      description: 'Tag Group',
      type: 'tag',
      entry,
      parent,
      documentName: document?.info.title ?? '',
    })

    return entryWithParent
  }

  // Headings from info.description
  if (entry.type === 'text') {
    index.push({
      id: entry.id,
      type: 'heading',
      title: entry.title ?? '',
      description: 'Heading',
      entry,
      parent,
      documentName: document?.info.title ?? '',
    })

    return entryWithParent
  }

  return entryWithParent
}
