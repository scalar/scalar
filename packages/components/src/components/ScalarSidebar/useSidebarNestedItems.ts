import { type InjectionKey, computed, inject, onBeforeUnmount, provide, shallowReactive } from 'vue'

type SidebarNestedItemOpenGetter = () => boolean

/**
 * Tracks the open state of the nearest nested child items
 */
const SIDEBAR_NESTED_ITEMS_SYMBOL = Symbol() as InjectionKey<Set<SidebarNestedItemOpenGetter>>

/**
 * Get the open / closed model for the nearest nested child items
 */
export const useSidebarNestedItem = (
  /** The getter for the open state of the current nested items */
  open: SidebarNestedItemOpenGetter,
): void => {
  const parentList = inject(SIDEBAR_NESTED_ITEMS_SYMBOL)

  if (parentList) {
    // Add this child to the parent list when the component is mounted
    parentList.add(open)

    onBeforeUnmount(() => {
      // Remove the reference to this child from the parent list when the component is unmounted
      parentList.delete(open)
    })
  }
}
/**
 * Get whether or not any nested child items are open
 */
export const useSidebarNestedItems = () => {
  // Create a reactive set with getters for each child's open state
  const children = shallowReactive(new Set<SidebarNestedItemOpenGetter>())

  const open = computed(() => {
    // Track the child list and each child's open state
    for (const getIsChildOpen of children) {
      if (getIsChildOpen()) {
        return true
      }
    }

    return false
  })

  provide(SIDEBAR_NESTED_ITEMS_SYMBOL, children)

  return {
    /** Whether or not any nested child items are open */
    open,
  }
}
