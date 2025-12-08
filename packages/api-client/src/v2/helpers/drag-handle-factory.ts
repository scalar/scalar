import { sortByOrder } from '@scalar/helpers/array/sort-by-order'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { dereference, escapeJsonPointer } from '@scalar/openapi-parser'
import type { DragOffset, DraggingItem, HoveredItem, SidebarState } from '@scalar/sidebar'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import { getOpenapiObject, getParentEntry } from '@scalar/workspace-store/navigation'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import type {
  TraversedDocument,
  TraversedEntry,
  TraversedOperation,
  TraversedTag,
} from '@scalar/workspace-store/schemas/navigation'
import type { OpenApiDocument, TagObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import { type MaybeRefOrGetter, toValue } from 'vue'

import { removeCircular } from '@/v2/helpers/remove-circular'

/**
 * Reorders items in an array by moving an item from one index to another,
 * adjusting insertion point based on offset.
 * Returns the new order array, or null if indices are invalid.
 */
const reorderArray = <T>(array: T[], fromIndex: number, toIndex: number, offset: DragOffset): T[] | null => {
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return null
  }

  const newArray = [...array]
  const [removed] = newArray.splice(fromIndex, 1)
  if (removed === undefined) {
    return null
  }

  const insertIndex = calculateInsertIndex(fromIndex, toIndex, offset, newArray.length)
  newArray.splice(insertIndex, 0, removed)
  return unpackProxyObject(newArray, { depth: 1 })
}

/**
 * Calculates the insertion index based on drag offset and direction.
 */
const calculateInsertIndex = (fromIndex: number, toIndex: number, offset: DragOffset, arrayLength: number): number => {
  const isMovingDown = fromIndex < toIndex

  if (offset === 'after') {
    return isMovingDown ? toIndex : toIndex + 1
  }

  if (offset === 'before') {
    return isMovingDown ? toIndex - 1 : toIndex
  }

  if (offset === 'into') {
    return arrayLength
  }

  return toIndex
}

/**
 * Type guard to check if an entry's type matches any of the provided types.
 *
 * @template Entry - The traversed entry type (must extend TraversedEntry).
 * @template Type - An array of allowed entry types to check against.
 * @param entry - The sidebar entry to check.
 * @param type - Array of entry types to match (e.g., ['document', 'tag']).
 * @returns {boolean} True if entry.type is included in the provided type array; otherwise, false.
 *
 * @example
 * isEntryType(someEntry, ['document', 'tag']) // true if someEntry.type === 'document' or 'tag'
 */
const isEntryType = <Entry extends TraversedEntry, const Type extends TraversedEntry['type'][]>(
  entry: Entry,
  type: Type,
): entry is Entry & { type: Type[number] } => {
  return type.includes(entry.type)
}

/**
 * Determines if the hovered item qualifies as a "reorder" operation.
 * Reorder means moving before or after another item, not dropping
 * into a parent container.
 */
const isReorder = (hoveredItem: HoveredItem): boolean => {
  return hoveredItem.offset === 'before' || hoveredItem.offset === 'after'
}

/**
 * Determines if the hovered item represents a "drop into parent" operation.
 */
const isDropIntoParent = (hoveredItem: HoveredItem): boolean => {
  return hoveredItem.offset === 'into'
}

/**
 * Checks if two sidebar entries (dragging and hovered) share the same parent.
 *
 * This is useful for determining if items can be reordered within the same context,
 * such as reordering tags or operations under the same tag or document, during drag-and-drop operations.
 *
 * @param draggingItem - The entry currently being dragged (must have a parent to compare).
 * @param hoveredItem - The entry currently hovered over (must have a parent to compare).
 * @returns {boolean} True if both entries have the same parent (by id), false otherwise.
 *
 * @example
 * const parent = { id: 'doc-1', type: 'document' };
 * const tagA = { id: 'tag-1', type: 'tag', parent };
 * const tagB = { id: 'tag-2', type: 'tag', parent };
 * itemsShareParent(tagA, tagB); // true
 *
 * const otherParent = { id: 'doc-2', type: 'document' };
 * const tagC = { id: 'tag-3', type: 'tag', parent: otherParent };
 * itemsShareParent(tagA, tagC); // false
 */
const itemsShareParent = (
  draggingItem: TraversedEntry & { parent?: TraversedEntry },
  hoveredItem: TraversedEntry & { parent?: TraversedEntry },
): boolean => {
  if (!draggingItem.parent || !hoveredItem.parent) {
    return false
  }
  return draggingItem.parent.id === hoveredItem.parent.id
}

/**
 * Triggers rebuilding of the sidebar for a specific document entry.
 * This is called after operations that alter the sidebar structure.
 */
const rebuildSidebar = ({ store, entry }: { store: WorkspaceStore; entry: TraversedEntry }): void => {
  const documentEntry = getParentEntry('document', entry)
  if (documentEntry) {
    store.buildSidebar(documentEntry.name)
  }
}

/**
 * Gets the current order array for a parent entry.
 * Falls back to children IDs if no explicit order exists.
 */
const getCurrentOrder = (
  parent: WorkspaceDocument | TagObject,
  parentEntry: TraversedDocument | TraversedTag,
): string[] => {
  const order = parent['x-scalar-order']
  return order ?? parentEntry.children?.map((child) => child.id) ?? []
}

/**
 * Handles reordering of entries (tags or operations) within the same parent.
 */
const handleReorderWithinParent = (
  store: WorkspaceStore,
  draggingItem: TraversedEntry & { parent?: TraversedEntry },
  hoveredItem: TraversedEntry & { parent?: TraversedEntry },
  offset: DragOffset,
): boolean => {
  const parentEntry = draggingItem.parent
  if (!parentEntry || !isEntryType(parentEntry, ['tag', 'document'])) {
    return false
  }

  const parent = getOpenapiObject({ store, entry: parentEntry })
  if (!parent) {
    return false
  }

  const currentOrder = getCurrentOrder(parent, parentEntry)
  const draggedIndex = currentOrder.findIndex((id) => id === draggingItem.id)
  const hoveredIndex = currentOrder.findIndex((id) => id === hoveredItem.id)

  const newOrder = reorderArray(currentOrder, draggedIndex, hoveredIndex, offset)
  if (!newOrder) {
    return false
  }

  parent['x-scalar-order'] = newOrder
  rebuildSidebar({ store, entry: parentEntry })
  return true
}

/**
 * Updates operation tags when moving between different parents.
 */
const updateOperationTags = (
  operation: OperationObject,
  draggedTag: TraversedTag | null,
  hoveredTag: TraversedTag | null,
): void => {
  const tags = new Set(operation.tags ?? [])

  if (hoveredTag) {
    tags.add(hoveredTag.name)
  }

  if (draggedTag) {
    tags.delete(draggedTag.name)
  }

  operation.tags = Array.from(tags)
}

/**
 * Moves an operation from one document to another.
 */
const moveOperationBetweenDocuments = (
  draggingDocument: WorkspaceDocument,
  hoveredDocument: WorkspaceDocument,
  draggingItem: TraversedOperation,
  operationCopy: OperationObject,
): void => {
  // Delete from old location
  if (draggingDocument.paths?.[draggingItem.path]?.[draggingItem.method]) {
    delete draggingDocument.paths[draggingItem.path]![draggingItem.method]
  }

  // Add to new location
  if (!hoveredDocument.paths) {
    hoveredDocument.paths = {
      [draggingItem.path]: {
        [draggingItem.method]: operationCopy,
      },
    }
  } else {
    if (!hoveredDocument.paths[draggingItem.path]) {
      hoveredDocument.paths[draggingItem.path] = {}
    }
    hoveredDocument.paths[draggingItem.path]![draggingItem.method] = operationCopy
  }
}

/**
 * Retrieves the dereferenced operation object for a given path and method.
 * This resolves all $ref references so you always get the full, dereferenced operation.
 */
const getDereferencedOperation = (
  document: WorkspaceDocument,
  path: string,
  method: HttpMethod,
): OperationObject | undefined => {
  const result = dereference(document).schema as OpenApiDocument
  const operation = result.paths?.[path]?.[method]

  return removeCircular(operation, { prefix: `#/paths/${escapeJsonPointer(path)}/${method}` }) as
    | OperationObject
    | undefined
}

/**
 * Handles moving an operation between different documents/tags.
 */
const handleMoveOperation = (
  store: WorkspaceStore,
  draggingItem: TraversedOperation,
  hoveredItem: TraversedTag | TraversedDocument,
): boolean => {
  const draggingDocumentEntry = getParentEntry('document', draggingItem)
  const hoveredDocumentEntry = getParentEntry('document', hoveredItem)

  if (!draggingDocumentEntry || !hoveredDocumentEntry) {
    return false
  }

  const draggingDocument = getOpenapiObject({ store, entry: draggingDocumentEntry })
  const hoveredDocument = getOpenapiObject({ store, entry: hoveredDocumentEntry })

  if (!draggingDocument || !hoveredDocument) {
    return false
  }

  const currentOperation = getDereferencedOperation(
    unpackProxyObject(draggingDocument),
    draggingItem.path,
    draggingItem.method,
  )

  if (!currentOperation) {
    return false
  }

  const draggedTag = getParentEntry('tag', draggingItem) ?? null
  const hoveredTag = getParentEntry('tag', hoveredItem) ?? null

  updateOperationTags(currentOperation, draggedTag, hoveredTag)

  // Create deep copy to avoid proxy reference issues
  moveOperationBetweenDocuments(draggingDocument, hoveredDocument, draggingItem, currentOperation)

  // Rebuild sidebars for both documents
  rebuildSidebar({ store, entry: draggingItem })
  rebuildSidebar({ store, entry: hoveredItem })

  return true
}

/**
 * Handles document reordering.
 */
const handleDocumentReorder = (
  store: WorkspaceStore,
  draggingItem: TraversedDocument,
  hoveredItem: TraversedDocument,
  offset: DragOffset,
): boolean => {
  const order = store.workspace['x-scalar-order'] ?? []
  const documents = Object.keys(store.workspace.documents)
  const currentOrder = sortByOrder(documents, order, (item) => item)
  const draggedIndex = currentOrder.findIndex((id) => id === draggingItem.id)
  const hoveredIndex = currentOrder.findIndex((id) => id === hoveredItem.id)

  const newOrder = reorderArray(currentOrder, draggedIndex, hoveredIndex, offset)
  if (!newOrder) {
    return false
  }

  store.update('x-scalar-order', newOrder)
  return true
}

/**
 * Factory function that creates drag and drop handlers for sidebar items.
 * Handles reordering and moving of documents, tags, and operations.
 */
export const dragHandleFactory = ({
  store: _store,
  sidebarState,
}: {
  store: MaybeRefOrGetter<WorkspaceStore | null>
  sidebarState: SidebarState<TraversedEntry>
}) => {
  /**
   * Handles the end of a drag operation.
   * Returns true if the drag and drop was successful, false otherwise.
   */
  const handleDragEnd = (_draggingItem: DraggingItem, _hoveredItem: HoveredItem): boolean => {
    const store = toValue(_store)
    if (!store) {
      return false
    }

    const draggingItem = sidebarState.getEntryById(_draggingItem.id)
    const hoveredItem = sidebarState.getEntryById(_hoveredItem.id)

    if (!draggingItem || !hoveredItem) {
      return false
    }

    // Handle document reordering
    if (draggingItem.type === 'document') {
      if (hoveredItem.type !== 'document' || !isReorder(_hoveredItem)) {
        return false
      }
      return handleDocumentReorder(store, draggingItem, hoveredItem, _hoveredItem.offset)
    }

    // Handle tag reordering
    if (draggingItem.type === 'tag') {
      if (hoveredItem.type !== 'tag' || !isReorder(_hoveredItem) || !itemsShareParent(draggingItem, hoveredItem)) {
        return false
      }
      return handleReorderWithinParent(
        store,
        draggingItem as TraversedEntry & { parent?: TraversedEntry },
        hoveredItem as TraversedEntry & { parent?: TraversedEntry },
        _hoveredItem.offset,
      )
    }

    // Handle operation reordering and moving
    if (draggingItem.type === 'operation') {
      // Reorder within same parent
      if (isReorder(_hoveredItem) && itemsShareParent(draggingItem, hoveredItem)) {
        return handleReorderWithinParent(
          store,
          draggingItem as TraversedEntry & { parent?: TraversedEntry },
          hoveredItem as TraversedEntry & { parent?: TraversedEntry },
          _hoveredItem.offset,
        )
      }

      // Move between different documents/tags
      if (isEntryType(hoveredItem, ['tag', 'document']) && isDropIntoParent(_hoveredItem)) {
        return handleMoveOperation(store, draggingItem, hoveredItem)
      }
    }

    return false
  }

  /**
   * Determines if an item can be dropped on another item.
   * Returns true if the drop operation is allowed, false otherwise.
   */
  const isDroppable = (_draggingItem: DraggingItem, _hoveredItem: HoveredItem): boolean => {
    const store = toValue(_store)
    if (!store) {
      return false
    }

    const draggingItem = sidebarState.getEntryById(_draggingItem.id)
    const hoveredItem = sidebarState.getEntryById(_hoveredItem.id)

    if (!draggingItem || !hoveredItem) {
      return false
    }

    // Examples cannot be reordered
    if (draggingItem.type === 'example') {
      return false
    }

    // Documents can only be reordered (not dropped into other documents)
    if (draggingItem.type === 'document') {
      return hoveredItem.type === 'document' && isReorder(_hoveredItem)
    }

    // Tags can only be reordered within the same parent
    if (draggingItem.type === 'tag') {
      return isReorder(_hoveredItem) && itemsShareParent(draggingItem, hoveredItem)
    }

    // Operations can be reordered within the same parent or moved between documents/tags
    if (draggingItem.type === 'operation') {
      const hoveredDocumentEntry = getParentEntry('document', hoveredItem)
      const draggingDocumentEntry = getParentEntry('document', draggingItem)

      if (!hoveredDocumentEntry || !draggingDocumentEntry) {
        return false
      }

      const hoveredDocument = getOpenapiObject({ store, entry: hoveredDocumentEntry })
      if (!hoveredDocument) {
        return false
      }

      const sameParent = itemsShareParent(draggingItem, hoveredItem)

      // Don't allow reorder when parents are different
      if (isReorder(_hoveredItem) && !sameParent) {
        return false
      }

      // Same parent: allow reorder or drop into tag/document
      if (sameParent) {
        return (
          isReorder(_hoveredItem) || (isDropIntoParent(_hoveredItem) && isEntryType(hoveredItem, ['tag', 'document']))
        )
      }

      // Different parents: allow drop into tag/document if no path conflict
      return (
        isDropIntoParent(_hoveredItem) &&
        isEntryType(hoveredItem, ['tag', 'document']) &&
        (draggingDocumentEntry.id === hoveredDocumentEntry.id ||
          hoveredDocument.paths?.[draggingItem.path]?.[draggingItem.method] === undefined)
      )
    }

    return false
  }

  return {
    handleDragEnd,
    isDroppable,
  }
}
