import type { Item, Layout } from '@/types'

export const filterItems = (layout: Layout, items: Item[]) => {
  if (layout === 'reference') {
    return items
  }

  // For client layout, filter to only show documents, operations, examples, and tags
  return items.filter(
    (c) => c.type === 'document' || c.type === 'operation' || c.type === 'example' || c.type === 'tag',
  )
}
