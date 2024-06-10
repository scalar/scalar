import { ref } from 'vue'

/**
 * Item you are currently dragging over
 */
export type HoveredItem = {
  id: string
  parentId: string | null
  /**
   * Offset is used when adding back an item, also for the highlight classes
   * 0 = above      | .dragover-above
   * 1 = below      | .dragover-below
   * 2 = as a child | .dragover-asChild
   */
  offset: number
}

/**
 * Item you are currently dragging
 */
export type DraggingItem = Omit<HoveredItem, 'offset'>

/**
 * Item you are currently dragging
 */
export const draggingItem = ref<DraggingItem | null>(null)

/**
 * Item you are currently dragging over
 */
export const hoveredItem = ref<HoveredItem | null>(null)
