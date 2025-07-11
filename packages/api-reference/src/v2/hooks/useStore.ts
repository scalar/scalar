import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { inject, provide, type InjectionKey } from 'vue'

const SYMBOL = Symbol() as InjectionKey<WorkspaceStore>

/**
 * Composable for accessing the new workspace store
 *
 * When called with a store it provides that store
 * When called without parameters, it returns the injected store
 */
export const useStore = (store?: WorkspaceStore) => {
  if (store) {
    provide(SYMBOL, store)
    return store
  }

  const injectedStore = inject(SYMBOL)
  if (!injectedStore) {
    throw new Error(
      'useStore() was called without a store and no store instance was found. ' +
        'Make sure to call useStore(store) in a parent component first.',
    )
  }

  return injectedStore
}
