import type { DraggingItem, HoveredItem } from '@scalar/draggable'
import { type SidebarState, getParentEntry } from '@scalar/sidebar'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { TraversedEntry, TraversedOperation } from '@scalar/workspace-store/schemas/navigation'
import { type MaybeRefOrGetter, toValue } from 'vue'

const getTargetFromEntry = ({
  store,
  documentName,
  entry,
}: {
  store: WorkspaceStore
  documentName: string
  entry: TraversedEntry
}) => {
  const document = store.workspace.documents[documentName]

  if (!document) {
    return null
  }

  if (entry.type === 'document') {
    return document
  }

  if (entry.type === 'tag') {
    return document.tags?.find((tag) => tag.name === entry.name)
  }

  return null
}

const getOperationFromEntry = ({
  store,
  documentName,
  entry,
}: {
  store: WorkspaceStore
  documentName: string
  entry: TraversedOperation
}) => {
  const document = store.workspace.documents[documentName]

  if (!document) {
    return null
  }

  return getResolvedRef(document.paths?.[entry.path]?.[entry.method]) ?? null
}

export const dragHandleFactory = ({
  store: _store,
  sidebarState,
}: {
  store: MaybeRefOrGetter<WorkspaceStore | null>
  sidebarState: SidebarState<TraversedEntry>
}) => {
  // Return boolean to indicate if the drag and drop was successful
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

    console.log({ draggingItem, hoveredItem, _draggingItem, _hoveredItem })

    // Handle document reordering
    if (draggingItem.type === 'document' && hoveredItem.type === 'document') {
      const currentOrder = store.workspace['x-scalar-order'] ?? Object.keys(store.workspace.documents)

      const draggedIndex = currentOrder.findIndex((id) => id === draggingItem.id)
      const hoveredIndex = currentOrder.findIndex((id) => id === hoveredItem.id)

      if (draggedIndex === -1 || hoveredIndex === -1) {
        return false
      }

      currentOrder.splice(draggedIndex, 1)
      currentOrder.splice(hoveredIndex, 0, draggingItem.id)

      // Update the order of the documents
      store.update('x-scalar-order', currentOrder)
      return true
    }

    // For the tags we can only reorder them
    // Conditions:
    // - They need to share the same documenet
    // - The actual parent might be differnet, but the document should be the same
    // TODO: handle different parents
    if (draggingItem.type === 'tag') {
      const draggingDocument = getParentEntry('document', draggingItem)
      const hoveredDocument = getParentEntry('document', hoveredItem)

      if (draggingDocument !== hoveredDocument || !draggingDocument || !hoveredDocument) {
        return false
      }

      // Update the order of the tags
      const draggingParent = draggingItem.parent
      const hoveredParent = hoveredItem.parent

      console.log({ draggingParent, hoveredParent })

      // Check if the parents are tags or documents
      if (
        !draggingParent ||
        !hoveredParent ||
        (draggingParent.type !== 'tag' && draggingParent.type !== 'document') ||
        (hoveredParent.type !== 'tag' && hoveredParent.type !== 'document')
      ) {
        console.log('invalid parents, returning false')
        return false
      }

      // Update the order of the tags
      // When the parents are the same, we can reorder the tags within the same siblings
      if (draggingParent.id === hoveredParent.id) {
        console.log('same parent, ordering tags')
        const target = getTargetFromEntry({ store, documentName: draggingDocument.id, entry: draggingParent })

        console.log({ target })

        if (!target) {
          console.log('no target, returning false')
          return false
        }

        const currentOrder = unpackProxyObject(
          target['x-scalar-order'] ?? draggingParent.children?.map((child) => child.id) ?? [],
        )

        const draggedIndex = currentOrder.findIndex((id) => id === draggingItem.id)
        const hoveredIndex = currentOrder.findIndex((id) => id === hoveredItem.id)

        if (draggedIndex === -1 || hoveredIndex === -1) {
          console.log('no index, returning false')
          return false
        }

        currentOrder.splice(draggedIndex, 1)
        currentOrder.splice(hoveredIndex, 0, draggingItem.id)

        console.log({ message: 'handling tag reordering', target, currentOrder })

        target['x-scalar-order'] = unpackProxyObject(currentOrder, { depth: null })

        // Rebuild the sidebar for the document
        store.buildSidebar(draggingDocument.id)
        return true
      }

      // TODO: handle the case where the parents are differnet

      return true
    }

    if (draggingItem.type === 'operation') {
      const draggingDocument = getParentEntry('document', draggingItem)
      const hoveredDocument = getParentEntry('document', hoveredItem)

      // TODO: handle the case where the docuemnts are different
      if (draggingDocument !== hoveredDocument || !draggingDocument || !hoveredDocument) {
        console.log('dragging operation inside different documents, returning false')
        return false
      }

      console.log('dragging operation inside the same document')

      const draggingParent = draggingItem.parent
      const hoveredParent = hoveredItem.parent

      if (
        !draggingParent ||
        !hoveredParent ||
        (draggingParent.type !== 'tag' && draggingParent.type !== 'document') ||
        (hoveredParent.type !== 'tag' && hoveredParent.type !== 'document')
      ) {
        console.log('invalid parents, returning false')
        return false
      }

      if (draggingParent.id === hoveredParent.id) {
        // For the same parent, we just need to update the order of the operations
        console.log('same parent, ordering operations')

        const target = getTargetFromEntry({ store, documentName: draggingDocument.id, entry: draggingParent })

        if (!target) {
          console.log('no target, returning false')
          return false
        }

        const currentOrder = target['x-scalar-order'] ?? draggingParent.children?.map((child) => child.id) ?? []

        const draggedIndex = currentOrder.findIndex((id) => id === draggingItem.id)
        const hoveredIndex = currentOrder.findIndex((id) => id === hoveredItem.id)

        if (draggedIndex === -1 || hoveredIndex === -1) {
          console.log('no index, returning false')
          return false
        }

        currentOrder.splice(draggedIndex, 1)
        currentOrder.splice(hoveredIndex, 0, draggingItem.id)

        console.log({ target, currentOrder })

        target['x-scalar-order'] = unpackProxyObject(currentOrder)

        // Rebuild the sidebar for the document
        store.buildSidebar(draggingDocument.id)
        return true
      }

      console.log('different parent')

      // When the parents are different, we need to first remove the current tag from the operation
      const operation = getOperationFromEntry({ store, documentName: draggingDocument.id, entry: draggingItem })

      if (!operation) {
        console.log('no operation, returning false')
        return false
      }

      // When the current parent is a tag, we need to remove the operation from the tag
      // and add it to the new tag
      const currentTagParent = getParentEntry('tag', draggingItem)
      const newTagParent = getParentEntry('tag', hoveredItem)

      const currentTags = currentTagParent
        ? (operation.tags?.filter((tag) => tag !== currentTagParent.name) ?? [])
        : (operation.tags ?? [])
      const newTags = newTagParent ? [...currentTags, newTagParent.name] : currentTags

      operation.tags = Array.from(new Set(newTags))

      console.log('operaiton tags updated', operation.tags)

      // Here the tags are updated
      // Now make sure to update the ordering of the old target and the new target

      // TODO: make sure we move the operaiton to the new docuement, if that is the case

      // Rebuild the sidebar for the document
      store.buildSidebar(draggingDocument.id)
      return true
    }

    return false
  }

  const isDroppable = (_draggingItem: DraggingItem, _hoveredItem: HoveredItem) => {
    const draggingItem = sidebarState.getEntryById(_draggingItem.id)
    const hoveredItem = sidebarState.getEntryById(_hoveredItem.id)

    if (!draggingItem || !hoveredItem) {
      return false
    }

    // For the examples we don't allow reordering
    if (draggingItem?.type === 'example') {
      return false
    }

    // We can reorder documents
    // You can not drop the document into other documents, just order them
    if (draggingItem?.type === 'document') {
      return hoveredItem.type === 'document' && _hoveredItem.offset === 0
    }

    // For tags we can only reorder them
    if (draggingItem.type === 'tag') {
      return (
        hoveredItem.type === 'tag' &&
        _hoveredItem.offset === 0 &&
        getParentEntry('document', hoveredItem) === getParentEntry('document', draggingItem)
      )
    }

    // For operations we can reorder, move them to another tag but not to a tag group, another document
    if (draggingItem.type === 'operation') {
      return (
        (hoveredItem.type === 'tag' && hoveredItem.isGroup === false && draggingItem.parent !== hoveredItem.parent) ||
        (hoveredItem.type === 'document' && _hoveredItem.offset === 2) ||
        (hoveredItem.type === 'operation' && _hoveredItem.offset === 0)
      )
    }

    return false
  }

  return {
    handleDragEnd,
    isDroppable,
  }
}
