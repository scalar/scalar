import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { lazyBus } from '@/components/Lazy'
import { type Ref, computed, reactive, ref } from 'vue'

import type { TraverseSpecOptions } from '@/features/traverse-schema'
import { traverseDocument } from '@/features/traverse-schema'
import { scrollToId } from '@scalar/helpers/dom/scroll-to-id'
import { isDescription } from '@/features/traverse-schema/types'

/** Track which sidebar items are opened */
type CollapsedSidebarItems = Record<string, boolean>

/** Sidebar initialization options */
export type SidebarOptions = TraverseSpecOptions

/**
 * Creating sidebar with only one traversal of the spec
 *
 * TODO:
 *  - add the search index creation as well
 *  - update docs
 *  - tagged models
 */
export const createSidebar = (dereferencedDocument: Ref<OpenAPIV3_1.Document>, options: SidebarOptions) => {
  const collapsedSidebarItems = reactive<CollapsedSidebarItems>({})
  const isSidebarOpen = ref(false)

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
          if (ev.loaded === operationId) {
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

  /** Sidebar items, used directly in the sidebar */
  const items = computed(() => {
    const result = traverseDocument(dereferencedDocument.value, options)

    // Open all tags
    if (options.config.value.defaultOpenAllTags) {
      result.entries.forEach((entry) => setCollapsedSidebarItem(entry.id, true))
    }

    return result
  })

  /** Content items, we remove the intro items here and use this to generate our content */
  const contentItems = computed(() => items.value.entries.filter((entry) => !isDescription(entry)))

  return {
    collapsedSidebarItems,
    contentItems,
    isSidebarOpen,
    items,
    scrollToOperation,
    setCollapsedSidebarItem,
    toggleCollapsedSidebarItem,
  }
}
