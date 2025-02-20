import { useLayout } from '@/hooks'
import type { WorkspaceStore } from '@/store'
import type { ActiveEntitiesStore } from '@/store/active-entities'
import type { DraggingItem, HoveredItem } from '@scalar/draggable'
import type { Collection, Tag } from '@scalar/oas-utils/entities/spec'

/** Create DnD handlers */
export function dragHandlerFactory(
  activeWorkspace: ActiveEntitiesStore['activeWorkspace'],
  { isValidEntity, collections, collectionMutators, tags, tagMutators, workspaceMutators }: WorkspaceStore,
) {
  const { layout } = useLayout()

  /** Mutate tag OR collection */
  const mutateTagOrCollection = (parent: Collection | Tag, childUids: string[]) => {
    if (parent.type === 'collection') {
      collectionMutators.edit(parent.uid, 'children', childUids as Collection['children'])
    } else if (parent.type === 'tag') {
      tagMutators.edit(parent.uid, 'children', childUids as Tag['children'])
    }
  }

  /** Drag handler that mutates depending on the entity types */
  const handleDragEnd = (draggingItem: DraggingItem, hoveredItem: HoveredItem) => {
    if (!draggingItem || !hoveredItem) return

    const { id: draggingUid, parentId: draggingParentUid } = draggingItem
    const { id: hoveredUid, parentId: hoveredParentUid, offset } = hoveredItem

    // Parent is the workspace
    if (!draggingParentUid && activeWorkspace.value) {
      workspaceMutators.edit(
        activeWorkspace.value.uid,
        'collections',
        activeWorkspace.value.collections.filter((uid) => uid !== draggingUid) ?? [],
      )
    }

    // Parent is collection
    else if (isValidEntity(draggingParentUid, collections)) {
      collectionMutators.edit(
        draggingParentUid,
        'children',
        collections[draggingParentUid]!.children.filter((uid) => uid !== draggingUid),
      )
    }
    // Parent is a tag
    else if (isValidEntity(draggingParentUid, tags)) {
      tagMutators.edit(
        draggingParentUid,
        'children',
        tags[draggingParentUid]!.children.filter((uid) => uid !== draggingUid),
      )
    }

    // Place it at the end of the list of the hoveredItem
    if (offset === 2) {
      const parent = collections[hoveredUid as Collection['uid']] || tags[hoveredUid as Tag['uid']]
      if (parent) mutateTagOrCollection(parent, [...(parent.children ?? []), draggingUid])
    }
    // Special case for collections
    else if (!hoveredParentUid) {
      const newChildUids = [...(activeWorkspace.value?.collections ?? [])]
      const hoveredIndex = newChildUids.findIndex((uid) => hoveredUid === uid) ?? 0
      newChildUids.splice(hoveredIndex + offset, 0, draggingUid as Collection['uid'])

      if (activeWorkspace.value) workspaceMutators.edit(activeWorkspace.value.uid, 'collections', newChildUids)
    }
    // Place it into the list at an index
    else {
      const parent = collections[hoveredParentUid as Collection['uid']] || tags[hoveredParentUid as Tag['uid']]
      if (!parent) return

      const newChildUids = [...(parent.children ?? [])] as string[]
      const hoveredIndex = newChildUids.findIndex((uid) => hoveredUid === uid) ?? 0
      newChildUids.splice(hoveredIndex + offset, 0, draggingUid)

      mutateTagOrCollection(parent, newChildUids)
    }
  }

  /** Ensure only collections are allowed at the top level OR resources dropped INTO (offset 2) */
  const isDroppable = (draggingItem: DraggingItem, hoveredItem: HoveredItem) => {
    // Cannot drop in read only mode
    if (layout === 'modal') return false
    // Cannot drop requests/folders into a workspace
    if (!isValidEntity(draggingItem.id, collections) && hoveredItem.offset !== 2) return false
    // Collections cannot drop over Drafts
    if (
      isValidEntity(draggingItem.id, collections) &&
      collections[hoveredItem.id as Collection['uid']]?.info?.title === 'Drafts'
    )
      return false

    return true
  }

  return {
    handleDragEnd,
    isDroppable,
  }
}
