import type { DraggingItem, HoveredItem } from '@scalar/draggable'
import { type SidebarState, getParentEntry } from '@scalar/sidebar'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import type {
  TraversedDocument,
  TraversedEntry,
  TraversedOperation,
  TraversedTag,
} from '@scalar/workspace-store/schemas/navigation'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { TagObject } from '@scalar/workspace-store/schemas/v3.1/strict/tag'
import { type MaybeRefOrGetter, toValue } from 'vue'

/**
 * Reorders items in an array by moving an item from one index to another,
 * adjusting insertion point based on offset.
 * Returns the new order array, or null if indices are invalid.
 *
 * Offset meaning:
 * - offset 0: insert before the hovered item
 * - offset 1: insert after the hovered item
 * - offset 2: (used for drop-into-parent operations, not typical reorder)
 */
const reorderArray = <T>(array: T[], fromIndex: number, toIndex: number, offset: number): T[] | null => {
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return null
  }

  const newArray = [...array]
  const [removed] = newArray.splice(fromIndex, 1)
  if (removed === undefined) {
    return null
  }

  let insertIndex = toIndex

  // Offset handling: offset 1 means place after hovered, offset 0 means before
  if (offset === 1) {
    // If moving 'down', adjust for removal, otherwise just add +1 for after
    insertIndex = fromIndex < toIndex ? toIndex : toIndex + 1
  } else if (offset === 0) {
    // Insert before hovered item
    insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex
  } else if (offset === 2) {
    // For drop-into-parent, fall back to end of array
    insertIndex = newArray.length
  }

  // Clamp insertIndex
  if (insertIndex < 0) {
    insertIndex = 0
  }
  if (insertIndex > newArray.length) {
    insertIndex = newArray.length
  }

  newArray.splice(insertIndex, 0, removed)
  return unpackProxyObject(newArray, { depth: 1 })
}

const isEntryType = <Entry extends TraversedEntry, const Type extends TraversedEntry['type'][]>(
  entry: Entry,
  type: Type,
): entry is Entry & { type: Type[number] } => {
  return type.includes(entry.type)
}

const isReorder = (hoveredItem: HoveredItem): boolean => {
  return hoveredItem.offset < 2
}

const isDrop = (hoveredItem: HoveredItem): boolean => {
  return hoveredItem.offset === 2
}

const itemsShareParent = (
  draggingItem: TraversedEntry & { parent?: TraversedEntry },
  hoveredItem: TraversedEntry & { parent?: TraversedEntry },
): boolean => {
  if (!draggingItem.parent || !hoveredItem.parent) {
    return false
  }
  return draggingItem.parent.id === hoveredItem.parent.id
}

type GetOpenapiObject<Entry extends TraversedDocument | TraversedTag | TraversedOperation> =
  Entry extends TraversedDocument
    ? WorkspaceDocument
    : Entry extends TraversedTag
      ? TagObject
      : Entry extends TraversedOperation
        ? OperationObject
        : never

const getOpenapiObject = <Entry extends TraversedDocument | TraversedTag | TraversedOperation>({
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
    return (document.tags?.find((tag) => tag.name === entry.name) as GetOpenapiObject<Entry> | undefined) ?? null
  }

  if (entry.type === 'operation') {
    return (getResolvedRef(document.paths?.[entry.path]?.[entry.method]) as GetOpenapiObject<Entry> | undefined) ?? null
  }

  return null
}

const buildSidebar = ({ store, entry }: { store: WorkspaceStore; entry: TraversedEntry }) => {
  const documentEntry = getParentEntry('document', entry)

  if (!documentEntry) {
    return
  }

  store.buildSidebar(documentEntry.name)
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

    // Get the items from the sidebar state
    const draggingItem = sidebarState.getEntryById(_draggingItem.id)
    const hoveredItem = sidebarState.getEntryById(_hoveredItem.id)

    // If the items are not found, return false
    // We can not process the drag and drop if we can not find the items
    if (!draggingItem || !hoveredItem) {
      return false
    }

    // Handle docuemnts reordering
    if (draggingItem.type === 'document') {
      // Documents can only be reordered (not dropped into other documents)
      if (hoveredItem.type !== 'document' || !isReorder(_hoveredItem)) {
        return false
      }

      // Get the current order of the documents
      const currentOrder = store.workspace['x-scalar-order'] ?? Object.keys(store.workspace.documents)

      const draggedIndex = currentOrder.findIndex((id) => id === draggingItem.id)
      const hoveredIndex = currentOrder.findIndex((id) => id === hoveredItem.id)

      const newOrder = reorderArray(currentOrder, draggedIndex, hoveredIndex, _hoveredItem.offset)

      if (!newOrder) {
        return false
      }

      store.update('x-scalar-order', newOrder)
      // The reorder has been successful, we can return true
      return true
    }

    // Handle tags reordering
    if (draggingItem.type === 'tag') {
      // Tags can only be reordered within the same parent
      if (hoveredItem.type !== 'tag' || !isReorder(_hoveredItem) || !itemsShareParent(draggingItem, hoveredItem)) {
        return false
      }

      if (!draggingItem.parent || !isEntryType(draggingItem.parent, ['tag', 'document'])) {
        return false
      }

      // tags share the same parent so we can get the parent object
      const parent = getOpenapiObject({ store, entry: draggingItem.parent })

      if (!parent) {
        return false
      }

      // get the current order of the tags in the parent
      const currentOrder = parent['x-scalar-order'] ?? draggingItem.parent.children?.map((child) => child.id) ?? []

      const draggedIndex = currentOrder.findIndex((id) => id === draggingItem.id)
      const hoveredIndex = currentOrder.findIndex((id) => id === hoveredItem.id)

      const newOrder = reorderArray(currentOrder, draggedIndex, hoveredIndex, _hoveredItem.offset)

      if (!newOrder) {
        return false
      }

      parent['x-scalar-order'] = newOrder
      // Build the sidebar
      buildSidebar({ store, entry: draggingItem.parent })
      return true
    }

    // Handle operations reordering & moving
    if (draggingItem.type === 'operation') {
      // Handle reordering under the same parent
      if (hoveredItem.type === 'operation' && isReorder(_hoveredItem) && itemsShareParent(draggingItem, hoveredItem)) {
        // This logic can be extracted to a separate function, we can share this kind of logic with the tags reordering
        if (!draggingItem.parent || !isEntryType(draggingItem.parent, ['tag', 'document'])) {
          return false
        }

        // tags share the same parent so we can get the parent object
        const parent = getOpenapiObject({ store, entry: draggingItem.parent })

        if (!parent) {
          return false
        }

        // get the current order of the tags in the parent
        const currentOrder = parent['x-scalar-order'] ?? draggingItem.parent.children?.map((child) => child.id) ?? []

        const draggedIndex = currentOrder.findIndex((id) => id === draggingItem.id)
        const hoveredIndex = currentOrder.findIndex((id) => id === hoveredItem.id)

        const newOrder = reorderArray(currentOrder, draggedIndex, hoveredIndex, _hoveredItem.offset)

        if (!newOrder) {
          return false
        }

        parent['x-scalar-order'] = newOrder
        // Build the sidebar
        buildSidebar({ store, entry: draggingItem.parent })

        return true
      }

      // Handle moving operations between different documents and/or tags
      if (isEntryType(hoveredItem, ['tag', 'document']) && isDrop(_hoveredItem)) {
        // We need to make sure to update the tags fields of the current operation
        const currentOperation = getOpenapiObject({ store, entry: draggingItem })

        if (!currentOperation) {
          return false
        }

        const tags = new Set(currentOperation.tags ?? [])

        const draggedTag = getParentEntry('tag', draggingItem)
        const hoveredTag = getParentEntry('tag', hoveredItem)

        // When droping into a tag, we need to add the tag to the current operation
        if (hoveredTag) {
          tags.add(hoveredTag.name)
        }

        // We remove when the operation is dragged from a tag
        if (draggedTag) {
          tags.delete(draggedTag.name)
        }

        // We update the operation tags
        currentOperation.tags = Array.from(tags)

        // Now we need to move the operaiton to the new location
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

        // Create a deep copy of the operation before deleting it from the old location
        // This ensures we're assigning a plain object, not a proxy reference that might be broken
        const operationCopy = unpackProxyObject(currentOperation, { depth: null })

        // Delete the operation from the old location
        if (draggingDocument.paths?.[draggingItem.path]?.[draggingItem.method]) {
          delete draggingDocument.paths?.[draggingItem.path]?.[draggingItem.method]
        }

        // Add the operation to the new location
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
          // We just created the path object if it didn't exist, so we can safely set the operation
          hoveredDocument.paths[draggingItem.path]![draggingItem.method] = operationCopy
        }

        // Update the old parent's x-scalar-order
        const draggingParent = draggingItem.parent
        // When dropping on a document or tag, the hoveredParent is the hoveredItem itself
        // (not its parent), since we're dropping INTO that document/tag
        const hoveredParent = hoveredItem

        if (!draggingParent || !isEntryType(draggingParent, ['tag', 'document']) || !hoveredParent) {
          return false
        }

        const oldTarget = getOpenapiObject({ store, entry: draggingParent })

        // TODO: after the self healing, we don't need to manually remove and add the items to the order list
        // !We would only need to do that on reorder, not on move
        // Only update the old target, the new target will be updated by the buildSidebar call
        if (oldTarget?.['x-scalar-order']) {
          oldTarget['x-scalar-order'] = unpackProxyObject(
            oldTarget['x-scalar-order'].filter((id: string) => id !== draggingItem.id),
            { depth: null },
          )
        }

        // Rebuild sidebars for both documents
        buildSidebar({ store, entry: draggingParent })
        buildSidebar({ store, entry: hoveredParent })

        return true
      }

      return false
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
      return hoveredItem.type === 'tag' && isReorder(_hoveredItem) && itemsShareParent(draggingItem, hoveredItem)
    }

    // Operation can be reorder when the parent is the same or dropped on a tag or document
    if (draggingItem.type === 'operation') {
      const hoveredDocumentEntry = getParentEntry('document', hoveredItem)
      const draggingDocumentEntry = getParentEntry('document', draggingItem)

      if (!hoveredDocumentEntry) {
        return false
      }

      const hoveredDocument = getOpenapiObject({ store, entry: hoveredDocumentEntry })
      if (!hoveredDocument) {
        return false
      }

      // You can not drop an example on a document with a conflicting path/method combination
      if (
        draggingDocumentEntry?.id !== hoveredDocumentEntry.id &&
        hoveredDocument.paths?.[draggingItem.path]?.[draggingItem.method]
      ) {
        return false
      }

      return (
        // for the same parent, you can reorder only
        (itemsShareParent(draggingItem, hoveredItem) && isReorder(_hoveredItem)) ||
        // for different parents, you can drop it inside a tag or a document only
        (!itemsShareParent(draggingItem, hoveredItem) &&
          isDrop(_hoveredItem) &&
          isEntryType(hoveredItem, ['tag', 'document']))
      )
    }

    return false
  }

  return {
    handleDragEnd,
    isDroppable,
  }
}
