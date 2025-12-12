import type { Item } from '@/types'

/**
 * Type guard to check if the given Item has a non-empty array of children.
 * Returns true if `currentItem` has a `children` property that is an array with at least one element.
 */
export const hasChildren = (currentItem: Item): currentItem is Item & { children: Item[] } => {
  return 'children' in currentItem && Array.isArray(currentItem.children) && currentItem.children.length > 0
}
