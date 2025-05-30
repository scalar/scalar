import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { computed, reactive, ref, type Ref } from 'vue'
import { lazyBus } from '@/components/Content/Lazy/lazyBus'
import { scrollToId } from '@/helpers/scroll-to-id'
import type { CreateSidebarOptions } from '@/features/Sidebar/types'
import { traverseDocument } from '@/features/Sidebar/helpers/traverse-document'

/** Track which sidebar items are opened */
type CollapsedSidebarItems = Record<string, boolean>

/**
 * Creating sidebar with only one traversal of the spec
 *
 * TODO:
 *  - add the search index creation as well
 *  - update docs
 */
export const createSidebar = (dereferencedDocument: Ref<OpenAPIV3_1.Document>, options: CreateSidebarOptions) => {
  const isSidebarOpen = options.isSidebarOpen ?? ref(false)
  const collapsedSidebarItems = reactive<CollapsedSidebarItems>({})

  const toggleCollapsedSidebarItem = (key: string) => (collapsedSidebarItems[key] = !collapsedSidebarItems[key])
  const setCollapsedSidebarItem = (key: string, value: boolean) => (collapsedSidebarItems[key] = value)

  /**
   * Scroll to operation
   *
   * Similar to scrollToId BUT in the case of a section not being open,
   * it uses the lazyBus to ensure the section is open before scrolling to it
   */
  const scrollToOperation = (operationId: string, focus?: boolean) => {
    const sectionId = options.getSectionId(operationId)

    if (sectionId && sectionId !== operationId) {
      // We use the lazyBus to check when the target has loaded then scroll to it
      if (!collapsedSidebarItems[sectionId]) {
        const unsubscribe = lazyBus.on((ev) => {
          if (ev.id === operationId) {
            scrollToId(operationId, focus)
            unsubscribe()
          }
        })
        setCollapsedSidebarItem(sectionId, true)
      } else {
        scrollToId(operationId, focus)
      }
    }
  }

  /** Sidebar items */
  const items = computed(() => traverseDocument(dereferencedDocument.value, options))

  // Open all tags on first render
  if (options.config.value.defaultOpenAllTags) {
    items.value.entries.forEach((entry) => setCollapsedSidebarItem(entry.id, true))
  }

  return {
    collapsedSidebarItems,
    isSidebarOpen,
    items,
    scrollToOperation,
    setCollapsedSidebarItem,
    toggleCollapsedSidebarItem,
  }
}
