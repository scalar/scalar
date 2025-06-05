import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { type InjectionKey, type Ref, inject, provide } from 'vue'

import { createSidebar, type SidebarOptions } from '@/features/sidebar/helpers/create-sidebar'
import type { TraverseSpecOptions } from '@/features/traverse-schema'

type Sidebar = ReturnType<typeof createSidebar>

/**
 * Injection key for the sidebar instance.
 * This ensures type safety when injecting the sidebar.
 */
export const SIDEBAR_SYMBOL: InjectionKey<Sidebar> = Symbol()

type UseSidebar = {
  (): Sidebar
  (content: Ref<OpenAPIV3_1.Document>, options: SidebarOptions): Sidebar
}

/**
 * Composable for managing the sidebar state.
 *
 * When called with a collection and options, it creates and provides a new sidebar instance.
 * When called without parameters, it returns the injected sidebar state.
 */
export const useSidebar: UseSidebar = (
  content?: Ref<OpenAPIV3_1.Document>,
  options?: TraverseSpecOptions,
): ReturnType<typeof createSidebar> => {
  // If collection is provided, create and provide a new sidebar instance
  if (content && options) {
    const sidebar = createSidebar(content, options)
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
