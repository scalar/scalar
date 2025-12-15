import { hasChildren } from '@/helpers/has-children'
import type { Item, Layout } from '@/types'

/**
 * Determines if a sidebar item should be treated as a "folder",
 * i.e. a collapsible group, depending on the layout, its type,
 * whether it has children, and special slot rules.
 *
 * @param layout - The sidebar layout ('client' or 'reference')
 * @param item - The sidebar item to check
 * @param hasEmptySlot - True if there is an empty slot to display as a group (client layout only)
 * @returns True if the item should be rendered as a folder/group node
 */
export const isSidebarFolder = (
  layout: Layout,
  item: Item,
  hasEmptySlot: boolean,
): item is Item & { children?: Item[] } => {
  // If the item has no children, check if there is an empty slot.
  if (!hasChildren(item)) {
    // In 'client' layout, allow "document" or "tag" items to act as group if there's an empty slot
    if (layout === 'client' && hasEmptySlot) {
      return item.type === 'document' || item.type === 'tag'
    }
    // Otherwise, not a folder if it has no children
    return false
  }

  // 'client' layout: any item with children is a folder
  if (layout === 'client') {
    return true
  }

  // 'reference' layout: only non-'operation' and non-'webhook' are groups/folders
  if (layout === 'reference') {
    return item.type !== 'operation' && item.type !== 'webhook'
  }

  // Fallback: not a folder in other cases/layouts
  return false
}
