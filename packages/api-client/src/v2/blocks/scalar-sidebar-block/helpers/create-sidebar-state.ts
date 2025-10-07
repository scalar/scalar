import { ref } from 'vue'

import { generateReverseIndex } from '@/v2/blocks/scalar-sidebar-block/helpers/generate-reverse-index'

type SidebarStateOptions = Partial<{
  hooks: {
    onBeforeExpand: (id: string) => void | Promise<void>
    onAfterExpand: (id: string) => void | Promise<void>
    onBeforeSelect: (id: string) => void | Promise<void>
    onAfterSelect: (id: string) => void | Promise<void>
  }
}>

export const createSidebarState = <T extends { id: string }>(items: T[], options?: SidebarStateOptions) => {
  const index = generateReverseIndex(items)
  const selectedItems = ref<Record<string, boolean>>({})
  const expandedItems = ref<Record<string, boolean>>({})

  const setSelected = async (id: string) => {
    /** Recursively mark all parent items as selected */
    const markSelected = (node: (T & { parent?: T }) | undefined) => {
      if (!node) {
        return
      }

      selectedItems.value[node.id] = true

      if ('parent' in node && node.parent) {
        markSelected(node.parent)
      }
    }

    if (options?.hooks?.onBeforeSelect) {
      await options.hooks.onBeforeSelect(id)
    }

    // Clear previous selection
    selectedItems.value = {}

    // Mark the selected item and all its parents as selected
    markSelected(index.get(id))

    if (options?.hooks?.onAfterSelect) {
      await options.hooks.onAfterSelect(id)
    }
  }

  const setExpanded = async (id: string, value: boolean) => {
    const openParents = (node: (T & { parent?: T }) | undefined) => {
      if (!node) {
        return
      }

      expandedItems.value[node.id] = true

      if ('parent' in node && node.parent) {
        openParents(node.parent)
      }
    }

    if (options?.hooks?.onBeforeExpand) {
      await options.hooks.onBeforeExpand(id)
    }

    // when we collapse an expanded item, we don't want to collapse its parents
    if (value === false) {
      expandedItems.value[id] = false
    } else {
      // When we expand an item, we want to make sure all its parents are expanded too
      openParents(index.get(id))
    }

    if (options?.hooks?.onAfterExpand) {
      await options.hooks.onAfterExpand(id)
    }
  }

  return {
    index,
    selectedItems,
    expandedItems,
    setSelected,
    setExpanded,
  }
}
