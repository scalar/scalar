import type { Item, Layout } from '@/types'

/** The type of items we want to  */
const API_CLIENT_TYPES_SET = new Set(['document', 'operation', 'example', 'tag', 'webhook'])

export const filterItems = (layout: Layout, items: Item[], hideOperationDefaultExamples?: boolean): Item[] => {
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
    // Message details remain available in content and search, while the sidebar focuses on operations.
    return items.filter((item) => {
      if (item.type === 'asyncapi-message') {
        return false
      }
      // A channel with only catalog messages has no operation to navigate to.
      if (item.type === 'asyncapi-channel') {
        return item.children?.some((child) => child.type === 'asyncapi-operation') ?? false
      }
      return true
    })
  }

  // For client layout, show entries that can open an HTTP request.
  return items.filter((c) => API_CLIENT_TYPES_SET.has(c.type))
}
