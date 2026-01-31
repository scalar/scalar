import type { Item, Layout } from '@/types'

/** The type of items we want to  */
const API_CLIENT_TYPES_SET = new Set(['document', 'operation', 'example', 'tag'])

export const filterItems = (layout: Layout, items: Item[]) => {
  if (layout === 'reference') {
    return items
  }

  // For client layout, filter to only show documents, operations, examples, and tags
  return items.filter((c) => API_CLIENT_TYPES_SET.has(c.type))
}
