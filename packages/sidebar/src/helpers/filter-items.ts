import type { Item, Layout } from '@/types'

/** The type of items we want to  */
const API_CLIENT_TYPES_SET = new Set(['document', 'operation', 'example', 'tag'])

export const filterItems = (layout: Layout, items: Item[], hideOperationDefaultExamples?: boolean) => {
  // If we are hiding the default examples and there is only one example and it is the default example, we don't want to show it
  if (
    hideOperationDefaultExamples &&
    items.length === 1 &&
    items[0]?.type === 'example' &&
    items[0]?.name === 'default'
  ) {
    return []
  }

  if (layout === 'reference') {
    return items
  }

  // For client layout, filter to only show documents, operations, examples, and tags
  return items.filter((c) => API_CLIENT_TYPES_SET.has(c.type))
}
