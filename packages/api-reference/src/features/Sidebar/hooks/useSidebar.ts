import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { type InjectionKey, inject, provide } from 'vue'
import { createSidebar, type CreateSidebarOptions } from '../helpers/create-sidebar'

/**
 * Injection key for the sidebar instance.
 * This ensures type safety when injecting the sidebar.
 */
export const SIDEBAR_SYMBOL: InjectionKey<ReturnType<typeof createSidebar>> = Symbol()

/**
 * Composable for managing the sidebar state.
 *
 * When called with a collection, it creates and provides a new sidebar instance.
 * When called without parameters, it returns the injected sidebar instance.
 */
export function useSidebar(
  content?: OpenAPIV3_1.Document,
  options?: CreateSidebarOptions,
): ReturnType<typeof createSidebar> {
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
