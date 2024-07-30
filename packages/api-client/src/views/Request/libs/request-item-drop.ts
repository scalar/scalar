import type { useWorkspace } from '@/store'
import type { DraggingItem, HoveredItem } from '@scalar/draggable'
import type { Collection } from '@scalar/oas-utils/entities/workspace/collection'
import type { ComputedRef } from 'vue'

/** The onDrop event for a Request Sidebar Item */
export const requestItemDrop = (
  draggingCollection: Collection,
  draggingCollectionIndex: number,
  draggingItem: DraggingItem,
  hoveredItem: HoveredItem,
  collections: ComputedRef<Collection[]>,
  collectionMutators: ReturnType<typeof useWorkspace>['collectionMutators'],
) => {
  if (!draggingItem || !hoveredItem) return

  const { id: draggingUid, parentId: draggingParentUid } = draggingItem
  const { id: hoveredUid, parentId: hoveredParentUid, offset } = hoveredItem

  console.log({
    draggingUid,
    draggingParentUid,
    hoveredUid,
    hoveredParentUid,
    offset,
  })

  // We will always have a parent since top level collections are not draggable... yet
  if (!draggingParentUid || !hoveredParentUid) return

  const hoveredCollectionIndex = collections.value.findIndex(
    ({ uid, folders }) => uid === hoveredParentUid || folders[hoveredParentUid],
  )

  if (hoveredCollectionIndex === -1) return
  const hoveredCollection = collections.value[hoveredCollectionIndex]

  // Dropped into the same collection
  if (draggingCollection.uid === hoveredCollection.uid) {
    // Remove from root children
    if (draggingCollection.uid === draggingParentUid)
      collectionMutators.edit(
        draggingCollectionIndex,
        'children',
        draggingCollection.children.filter((uid) => uid !== draggingUid),
      )
    // Remove from a folder
    else if (draggingCollection.folders[draggingParentUid]?.children) {
      collectionMutators.edit(
        draggingCollectionIndex,
        `folders.${draggingParentUid}.children`,
        draggingCollection.folders[draggingParentUid].children.filter(
          (uid) => uid !== draggingUid,
        ),
      )
    }

    // Dropping into a folder
    if (offset === 2) {
      const newChildren = [...hoveredCollection.folders[hoveredUid].children]
      newChildren.push(draggingUid)

      collectionMutators.edit(
        draggingCollectionIndex,
        `folders.${hoveredUid}.children`,
        newChildren,
      )
    }
    // Add to root children
    else if (hoveredCollection.uid === hoveredParentUid) {
      const hoveredIndex =
        hoveredCollection.children.findIndex((uid) => hoveredUid === uid) ?? 0

      const newChildren = [...hoveredCollection.children]
      newChildren.splice(hoveredIndex + offset, 0, draggingUid)

      collectionMutators.edit(draggingCollectionIndex, 'children', newChildren)
    }
    // Add to folder
    else if (hoveredCollection.folders[hoveredParentUid]?.children) {
      const hoveredIndex =
        hoveredCollection.folders[hoveredParentUid].children.findIndex(
          (uid) => hoveredUid === uid,
        ) ?? 0

      const newChildren = [
        ...hoveredCollection.folders[hoveredParentUid].children,
      ]
      newChildren.splice(hoveredIndex + offset, 0, draggingUid)

      collectionMutators.edit(
        draggingCollectionIndex,
        `folders.${hoveredParentUid}.children`,
        newChildren,
      )
    }
  }
  // TODO write this when we have more than one collection to test with
  // We need to do a few extra things when its a different collection
  // else {
  // }
}
