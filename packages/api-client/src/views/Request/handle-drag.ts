import type { WorkspaceStore } from '@/store'
import type { DraggingItem, HoveredItem } from '@scalar/draggable'

/** Create DnD handlers */
export function dragHandlerFactory({
  collections,
  collectionMutators,
  tags,
  tagMutators,
  requests,
  requestHistory,
  workspaceMutators,
  activeWorkspace,
}: WorkspaceStore) {
  /** Mutate tag OR collection */
  function mutateTagOrCollection(uid: string, childUids: string[]) {
    if (collections[uid]) collectionMutators.edit(uid, 'children', childUids)
    else if (tags[uid]) tagMutators.edit(uid, 'children', childUids)
  }

  /** Drag handler that mutates depending on the entity types */
  function handleDragEnd(draggingItem: DraggingItem, hoveredItem: HoveredItem) {
    if (!draggingItem || !hoveredItem) return

    const { id: draggingUid, parentId: draggingParentUid } = draggingItem
    const { id: hoveredUid, parentId: hoveredParentUid, offset } = hoveredItem

    // Parent is the workspace
    if (!draggingParentUid) {
      workspaceMutators.edit(
        activeWorkspace.value.uid,
        'collections',
        activeWorkspace.value.collections.filter((uid) => uid !== draggingUid),
      )
    }

    // Parent is collection
    else if (collections[draggingParentUid]) {
      collectionMutators.edit(
        draggingParentUid,
        'children',
        collections[draggingParentUid].children.filter(
          (uid) => uid !== draggingUid,
        ),
      )
    }
    // Parent is a tag
    else if (tags[draggingParentUid]) {
      tagMutators.edit(
        draggingParentUid,
        'children',
        tags[draggingParentUid].children.filter((uid) => uid !== draggingUid),
      )
    }

    // Place it at the end of the list of the hoveredItem
    if (offset === 2) {
      const parent = collections[hoveredUid] || tags[hoveredUid]
      mutateTagOrCollection(hoveredUid, [...parent.children, draggingUid])
    }
    // Special case for collections
    else if (!hoveredParentUid) {
      const newChildUids = [...activeWorkspace.value.collections]
      const hoveredIndex =
        newChildUids.findIndex((uid) => hoveredUid === uid) ?? 0
      newChildUids.splice(hoveredIndex + offset, 0, draggingUid)

      workspaceMutators.edit(
        activeWorkspace.value.uid,
        'collections',
        newChildUids,
      )
    }
    // Place it into the list at an index
    else {
      const parent = collections[hoveredParentUid] || tags[hoveredParentUid]
      const newChildUids = [...parent.children]

      const hoveredIndex =
        newChildUids.findIndex((uid) => hoveredUid === uid) ?? 0
      newChildUids.splice(hoveredIndex + offset, 0, draggingUid)

      mutateTagOrCollection(hoveredParentUid, newChildUids)
    }
  }

  /** Ensure only collections are allowed at the top level OR resources dropped INTO (offset 2) */
  const isDroppable = (
    draggingItem: DraggingItem,
    hoveredItem: HoveredItem,
  ) => {
    // Cannot drop in read only mode
    if (activeWorkspace.value.isReadOnly) return false
    // Cannot drop requests/folders into a workspace
    if (!collections[draggingItem.id] && hoveredItem.offset !== 2) return false
    // Collections cannot drop over Drafts
    if (
      collections[draggingItem.id] &&
      collections[hoveredItem.id]?.info?.title === 'Drafts'
    )
      return false

    return true
  }

  return {
    handleDragEnd,
    isDroppable,
  }
}
