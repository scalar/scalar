import { traverseDocument, type TraversedEntry } from '@/features/traverse-schema'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { apiReferenceConfigurationSchema } from '@scalar/types'
import { vi } from 'vitest'
import { computed, ref } from 'vue'

/**
 * A collection of tools which are used strictly for testing
 */

export const createMockSidebar = (collapsedItems: Record<string, boolean> = {}, entries: TraversedEntry[] = []) => ({
  collapsedSidebarItems: collapsedItems,
  isSidebarOpen: ref(true),
  items: computed(() => ({ entries, titles: new Map() })),
  scrollToOperation: vi.fn(),
  setCollapsedSidebarItem: vi.fn(),
  toggleCollapsedSidebarItem: vi.fn(),
})

export const createMockSidebarFromDocument = (document: OpenAPIV3_1.Document) => {
  const result = traverseDocument(document, {
    config: ref(
      apiReferenceConfigurationSchema.parse({
        tagsSorter: 'alpha',
      }),
    ),
    getHeadingId: (heading: any) => heading.text?.toLowerCase().replace(/\s+/g, '-') || '',
    getModelId: (model?: any) => `model-${model?.name || 'unknown'}`,
    getOperationId: (operation: any) => `${operation.method}-${operation.path}`,
    getSectionId: (hashStr?: string) => `section-${hashStr || 'default'}`,
    getTagId: (tag: any) => `tag-${tag.name}`,
    getWebhookId: (webhook?: any) => `webhook-${webhook?.name || 'unknown'}`,
  })
  return createMockSidebar({}, result.entries)
}
