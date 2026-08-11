import type { Item, Layout } from '@/types'

/**
 * Entry types the API client sidebar renders. OpenAPI contributes documents, operations,
 * examples, and tags; AsyncAPI contributes channels, operations, and messages.
 */
const API_CLIENT_TYPES_SET = new Set([
  'document',
  'operation',
  'example',
  'tag',
  'asyncapi-channel',
  'asyncapi-operation',
  'asyncapi-message',
])

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

  // For the client layout, only show the entry types the API client can open.
  return items.filter((c) => API_CLIENT_TYPES_SET.has(c.type))
}
