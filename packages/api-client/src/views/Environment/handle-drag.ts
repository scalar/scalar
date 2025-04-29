import type { ActiveEntitiesStore } from '@/store/active-entities'
import type { DraggingItem, HoveredItem } from '@scalar/draggable'
import type { Collection } from '@scalar/oas-utils/entities/spec'

type CollectionMutator = {
  edit: (uid: Collection['uid'], path: 'x-scalar-environments', value: Collection['x-scalar-environments']) => void
}

/** Create environment DnD handlers */
export function environmentDragHandlerFactory(
  activeWorkspaceCollections: ActiveEntitiesStore['activeWorkspaceCollections'],
  collectionMutator: CollectionMutator,
) {
  /** Drag handler that mutates the collection's environments order */
  const handleDragEnd = (draggingItem: DraggingItem, hoveredItem: HoveredItem) => {
    if (!draggingItem || !hoveredItem) {
      return
    }

    const { id: draggingUid, parentId: draggingParentUid } = draggingItem
    const { id: hoveredUid, parentId: hoveredParentUid, offset } = hoveredItem

    // Only allow reordering within the same collection
    if (draggingParentUid !== hoveredParentUid) {
      return
    }

    const collection = activeWorkspaceCollections.value.find((c) => c.uid === draggingParentUid)

    if (!collection || !collection['x-scalar-environments']) {
      return
    }

    const environments = collection['x-scalar-environments']
    const envKeys = Object.keys(environments)
    const orderedEnvs = { ...environments }

    // Remove dragged item from its position
    const draggedIndex = envKeys.findIndex((key) => key === draggingUid)
    envKeys.splice(draggedIndex, 1)

    // Insert at new position
    const hoveredIndex = envKeys.findIndex((key) => key === hoveredUid)
    const targetIndex = hoveredIndex + (offset === 1 ? 1 : 0)
    envKeys.splice(targetIndex, 0, draggingUid)

    // Rebuild ordered environments object
    const reorderedEnvs = envKeys.reduce(
      (acc, key) => {
        const env = environments[key]
        if (env) {
          acc[key] = env
        }
        return acc
      },
      {} as typeof orderedEnvs,
    )

    collection['x-scalar-environments'] = reorderedEnvs
    collectionMutator.edit(collection.uid, 'x-scalar-environments', collection['x-scalar-environments'])
  }

  /** Ensure only environments within the same collection can be dropped */
  const isDroppable = (draggingItem: DraggingItem, hoveredItem: HoveredItem) => {
    return draggingItem.parentId === hoveredItem.parentId
  }

  return {
    handleDragEnd,
    isDroppable,
  }
}
