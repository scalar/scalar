import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type InjectionKey, inject, provide } from 'vue'

import { createSidebar } from '@/v2/blocks/scalar-sidebar-block/helpers/create-sidebar'

type Sidebar = ReturnType<typeof createSidebar>

/**
 * Injection key for the sidebar instance.
 * This ensures type safety when injecting the sidebar.
 */
export const SIDEBAR_SYMBOL: InjectionKey<Sidebar> = Symbol('sidebar')

/**
 * Composable for managing the sidebar state.
 *
 * When called with a collection and options, it creates and provides a new sidebar instance.
 * When called without parameters, it returns the injected sidebar state.
 */
export const useSidebar = (store?: WorkspaceStore): ReturnType<typeof createSidebar> => {
  // If collection is provided, create and provide a new sidebar instance
  if (store) {
    const sidebar = createSidebar(store)
    provide(SIDEBAR_SYMBOL, sidebar)

    return sidebar
  }

  // Otherwise, try to inject the existing sidebar instance
  const sidebar = inject(SIDEBAR_SYMBOL)

  if (!sidebar) {
    throw new Error(
      'useSidebar() was called without a collection and no sidebar instance was found. ' +
        'Make sure to call useSidebar(collection) in a parent component first.',
    )
  }

  return sidebar
}
