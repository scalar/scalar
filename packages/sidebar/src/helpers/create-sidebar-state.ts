import { ref } from 'vue'

import { generateReverseIndex } from './generate-reverse-index'

type SidebarStateOptions = Partial<{
  /** The key used to access child items in the sidebar tree. Defaults to "children". */
  key: string
  /** Optional event hooks for sidebar item lifecycle */
  hooks: Partial<{
    /**
     * Called before an item is expanded.
     * @param id - The ID of the item to expand.
     */
    onBeforeExpand: (id: string) => void | Promise<void>
    /**
     * Called after an item is expanded.
     * @param id - The ID of the item that was expanded.
     */
    onAfterExpand: (id: string) => void | Promise<void>
    /**
     * Called before an item is selected.
     * @param id - The ID of the item to select.
     */
    onBeforeSelect: (id: string) => void | Promise<void>
    /**
     * Called after an item is selected.
     * @param id - The ID of the item that was selected.
     */
    onAfterSelect: (id: string) => void | Promise<void>
  }>
}>

/**
 * Creates and manages the state for a sidebar tree, including selection and expansion of items.
 *
 * @template T - The type of sidebar items, which must include an `id` property.
 * @param items - The array of sidebar items.
 * @param options - Optional configuration for customizing behavior and hooks.
 * @returns An object containing sidebar state and methods to manipulate it.
 *
 * ## Example Usage
 *
 * ```ts
 * // Example sidebar items
 * const sidebarItems = [
 *   { id: 'root', label: 'Root', children: [
 *     { id: 'child1', label: 'Child 1' },
 *     { id: 'child2', label: 'Child 2', children: [
 *       { id: 'grandchild1', label: 'Grandchild 1' }
 *     ]}
 *   ]}
 * ]
 *
 * // Create sidebar state
 * const sidebarState = createSidebarState(sidebarItems, {
 *   key: 'children',
 *   hooks: {
 *     onBeforeSelect: (id) => console.log('Before select:', id),
 *     onAfterSelect: (id) => console.log('After select:', id),
 *     onBeforeExpand: (id) => console.log('Before expand:', id),
 *     onAfterExpand: (id) => console.log('After expand:', id),
 *   }
 * })
 *
 * // Select an item
 * await sidebarState.setSelected('grandchild1')
 * // Expand an item
 * await sidebarState.setExpanded('child2', true)
 * ```
 */
export const createSidebarState = <T extends { id: string }>(
  items: T[],
  options?: SidebarStateOptions,
) => {
  // Reverse index for quick lookup of items and their parents
  const index = generateReverseIndex(items, options?.key ?? 'children')
  // Reactive record of selected item ids
  const selectedItems = ref<Record<string, boolean>>({})
  // Reactive record of expanded item ids
  const expandedItems = ref<Record<string, boolean>>({})

  /**
   * Selects the given item by id, and recursively marks all its parent items as selected.
   * Triggers optional lifecycle hooks before and after selection.
   *
   * @param id - The ID of the item to select.
   *
   * ## Example
   * ```ts
   * await sidebarState.setSelected('grandchild1')
   * // selectedItems.value will include 'grandchild1', 'child2', and 'root'
   * ```
   */
  const setSelected = async (id: string) => {
    /**
     * Recursively mark all parent items as selected.
     * @param node - The current node to mark as selected.
     */
    const markSelected = (node: (T & { parent?: T }) | undefined) => {
      if (!node) {
        return
      }
      selectedItems.value[node.id] = true
      if ('parent' in node && node.parent) {
        markSelected(node.parent)
      }
    }

    // Call onBeforeSelect hook if provided
    if (options?.hooks?.onBeforeSelect) {
      await options.hooks.onBeforeSelect(id)
    }

    // Clear previous selection
    selectedItems.value = {}

    // Mark the selected item and all its parents as selected
    markSelected(index.get(id))

    // Call onAfterSelect hook if provided
    if (options?.hooks?.onAfterSelect) {
      await options.hooks.onAfterSelect(id)
    }
  }

  /**
   * Expands or collapses the given item by id.
   * When expanding, recursively expands all parent items.
   * Triggers optional lifecycle hooks before and after expansion.
   *
   * @param id - The ID of the item to expand or collapse.
   * @param value - true to expand, false to collapse.
   *
   * ## Example
   * ```ts
   * await sidebarState.setExpanded('child2', true)
   * // expandedItems.value will include 'child2' and 'root'
   *
   * await sidebarState.setExpanded('child2', false)
   * // expandedItems.value['child2'] will be false
   * ```
   */
  const setExpanded = async (id: string, value: boolean) => {
    /**
     * Recursively expand all parent items of the given node.
     * @param node - The current node to expand.
     */
    const openParents = (node: (T & { parent?: T }) | undefined) => {
      if (!node) {
        return
      }
      expandedItems.value[node.id] = true
      if ('parent' in node && node.parent) {
        openParents(node.parent)
      }
    }

    // Call onBeforeExpand hook if provided
    if (options?.hooks?.onBeforeExpand) {
      await options.hooks.onBeforeExpand(id)
    }

    // When collapsing, only collapse the specified item, not its parents
    if (value === false) {
      expandedItems.value[id] = false
    } else {
      // When expanding, ensure all parents are expanded as well
      openParents(index.get(id))
    }

    // Call onAfterExpand hook if provided
    if (options?.hooks?.onAfterExpand) {
      await options.hooks.onAfterExpand(id)
    }
  }

  return {
    items,
    index,
    selectedItems,
    expandedItems,
    setSelected,
    setExpanded,
  }
}

export type SidebarState<Item extends { id: string }> = ReturnType<
  typeof createSidebarState<Item>
>
