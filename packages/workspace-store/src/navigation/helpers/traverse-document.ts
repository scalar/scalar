import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { type NavigationOptions, getNavigationOptions } from '@/navigation/get-navigation-options'
import type { TagsMap } from '@/navigation/types'
import type { TraversedDocument, TraversedEntry } from '@/schemas/navigation'
import type { OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'

import { traverseDescription } from './traverse-description'
import { traversePaths } from './traverse-paths'
import { traverseSchemas } from './traverse-schemas'
import { traverseTags } from './traverse-tags'
import { traverseWebhooks } from './traverse-webhooks'

/**
 * Traverses an OpenAPI Document to generate navigation structure and metadata.
 *
 * This function processes the OpenAPI document to create:
 * - A hierarchical navigation structure for the sidebar
 * - A mapping of IDs to titles for mobile header navigation
 * - Tag-based organization of operations and webhooks
 * - Optional schema/model documentation
 */
export const traverseDocument = (documentName: string, document: OpenApiDocument, options?: NavigationOptions) => {
  const { hideModels, tagsSorter, operationsSorter, generateId } = getNavigationOptions(documentName, options)

  const documentId = generateId({
    type: 'document',
    info: document.info,
    name: documentName,
  })

  /** Map of tags and their entries */
  const tagsMap: TagsMap = new Map(
    document.tags?.map((tag) => [
      tag.name ?? 'Untitled Tag',
      { id: generateId({ type: 'tag', tag, parentId: documentId }), parentId: documentId, tag, entries: [] },
    ]) ?? [],
  )

  /** Generate entries for the document info description field */
  const entries: TraversedEntry[] = traverseDescription({
    generateId,
    parentId: documentId,
    info: document.info,
  })

  /** Traverse all the document path  */
  const { untaggedOperations } = traversePaths({ document, tagsMap, generateId, documentId })

  const untaggedWebhooksParentId = generateId({
    type: 'webhook',
    name: '',
    parentId: documentId,
  })

  const untaggedWebhooks = traverseWebhooks({
    document,
    generateId,
    tagsMap,
    untaggedWebhooksParentId,
    documentId,
  })

  const tagsEntries = traverseTags({
    document,
    tagsMap,
    documentId,
    options: { tagsSorter, operationsSorter, generateId },
  })

  // Add tagged operations, webhooks and tagGroups
  entries.push(...tagsEntries)
  // Add untagged operations
  entries.push(...untaggedOperations)

  // Add untagged webhooks
  if (untaggedWebhooks.length) {
    entries.push({
      type: 'tag',
      id: untaggedWebhooksParentId,
      title: 'Webhooks',
      name: 'Webhooks',
      children: untaggedWebhooks,
      isGroup: false,
      isWebhooks: true,
    })
  }

  // Add models if they are not hidden
  if (!hideModels && document.components?.schemas) {
    const untaggedModels = traverseSchemas({
      documentId,
      document,
      generateId,
      tagsMap,
    })

    if (untaggedModels.length) {
      entries.push({
        type: 'models',
        id: generateId({
          type: 'model',
          parentId: documentId,
        }),
        title: 'Models',
        name: 'Models',
        children: untaggedModels,
      })
    }
  }

  const sortOrder = document['x-scalar-order']

  // Try to sort the entries using the x-scalar-order
  if (sortOrder) {
    entries.sort((a, b) => {
      const indexA = sortOrder.indexOf(a.id)
      const indexB = sortOrder.indexOf(b.id)
      // If an id is not found, treat it as "infinity" so those items go last.
      const safeIndexA = indexA === -1 ? Number.POSITIVE_INFINITY : indexA
      const safeIndexB = indexB === -1 ? Number.POSITIVE_INFINITY : indexB
      return safeIndexA - safeIndexB
    })
  }

  // Now update the sort order of the entries
  document['x-scalar-order'] = unpackProxyObject(entries.map((entry) => entry.id))

  return {
    id: documentId,
    type: 'document',
    title: document.info.title,
    name: documentName,
    children: entries,
    icon: document['x-scalar-icon'],
  } satisfies TraversedDocument
}
