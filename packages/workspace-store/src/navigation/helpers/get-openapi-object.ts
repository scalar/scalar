import type { WorkspaceStore } from '@/client'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { WorkspaceDocument } from '@/schemas'
import type { TraversedDocument, TraversedEntry, TraversedOperation, TraversedTag } from '@/schemas/navigation'
import type { OperationObject, TagObject } from '@/schemas/v3.1/strict/openapi-document'

import { getParentEntry } from './get-parent-entry'

type TraversedOrderable = TraversedDocument | TraversedTag | TraversedOperation

type GetOpenapiObject<Entry extends TraversedOrderable> = Entry extends TraversedDocument
  ? WorkspaceDocument
  : Entry extends TraversedTag
    ? TagObject
    : Entry extends TraversedOperation
      ? OperationObject
      : never

/** Type guard which checks if the entry has an x-scalar-order property */
export const canHaveOrder = (entry: TraversedEntry): entry is TraversedOrderable =>
  entry.type === 'document' || entry.type === 'tag' || entry.type === 'operation'

/**
 * Retrieves the corresponding OpenAPI object (document, tag, or operation) from the workspace store based on the provided entry.
 *
 * This helper abstracts the common lookup logic for working with sidebar/drag-and-drop entries and their associated OpenAPI objects.
 * Returns `null` when the lookup cannot be completed (e.g., document/tag/operation not found).
 *
 * @template Entry Either TraversedDocument, TraversedTag, or TraversedOperation.
 * @param store - The workspace store containing loaded documents.
 * @param entry - The sidebar entry (document, tag, or operation).
 * @returns The corresponding OpenAPI object (WorkspaceDocument, TagObject, or OperationObject) or `null` if not found.
 *
 * @example
 * // For a Document entry:
 * const document = getOpenapiObject({ store, entry: documentEntry })
 *
 * // For a Tag entry:
 * const tag = getOpenapiObject({ store, entry: tagEntry })
 *
 * // For an Operation entry:
 * const operation = getOpenapiObject({ store, entry: operationEntry })
 */
export const getOpenapiObject = <Entry extends TraversedOrderable>({
  store,
  entry,
}: {
  store: WorkspaceStore
  entry: Entry
}): GetOpenapiObject<Entry> | null => {
  const documentEntry = getParentEntry('document', entry)
  if (!documentEntry) {
    return null
  }

  const document = store.workspace.documents[documentEntry.name]
  if (!document) {
    return null
  }

  if (entry.type === 'document') {
    return document as GetOpenapiObject<Entry>
  }

  if (entry.type === 'tag') {
    // Find the tag by name in the document's tags array
    return (document.tags?.find((tag) => tag.name === entry.name) as GetOpenapiObject<Entry> | undefined) ?? null
  }

  if (entry.type === 'operation') {
    // Fetch and resolve the referenced operation object at the given path/method
    return (getResolvedRef(document.paths?.[entry.path]?.[entry.method]) as GetOpenapiObject<Entry> | undefined) ?? null
  }

  // If entry type is unknown, return null
  return null
}
