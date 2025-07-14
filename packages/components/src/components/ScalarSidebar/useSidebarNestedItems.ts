import { computed, inject, onBeforeUnmount, provide, ref, type InjectionKey, type Ref } from 'vue'

/**
 * Tracks the open state of the nearest nested child items
 *
 * @default false
 */
export const SIDEBAR_NESTED_ITEMS_SYMBOL = Symbol() as InjectionKey<Ref<Ref<boolean>[]>>

/**
 * Get the open / closed model for the nearest nested child items
 */
export const useSidebarNestedItem = (
  /** The model defining the open state of the current nested items */
  open: Ref<boolean>,
) => {
  const parentList = inject(SIDEBAR_NESTED_ITEMS_SYMBOL)
  if (parentList) {
    // Add this child to the parent list when the component is mounted
    parentList.value.push(open)

    onBeforeUnmount(() => {
      // Remove this child from the parent list when the component is unmounted
      parentList.value = parentList.value.filter((child) => child !== open)
    })
  }
}
/**
 * Get whether or not any nested child items are open
 */
export const useSidebarNestedItems = () => {
  // Create a new ref for any child nested items to update
  const children = ref<Ref<boolean>[]>([])
  const open = computed(() => children.value.some((child) => child.value))
  provide(SIDEBAR_NESTED_ITEMS_SYMBOL, children)

  return {
    /** Whether or not any nested child items are open */
    open,
  }
}
