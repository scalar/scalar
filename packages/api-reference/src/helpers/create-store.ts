import {
  ACTIVE_ENTITIES_SYMBOL,
  WORKSPACE_SYMBOL,
  createActiveEntitiesStore,
  createWorkspaceStore,
} from '@scalar/api-client/store'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { type ComputedRef, type Ref, provide, watch } from 'vue'

/**
 * Create a store for the API Reference, holding all the information from the OpenAPI document(s).
 */
export function createStore(
  content: string | Ref<string> | ComputedRef<string>,
  configuration: ApiReferenceConfiguration,
): {
  store: ReturnType<typeof createWorkspaceStore>
  activeEntitiesStore: ReturnType<typeof createActiveEntitiesStore>
} {
  // Create the workspace store
  const store = createWorkspaceStore({
    useLocalStorage: false,
    ...configuration,
  })

  // TODO: Update configuration

  // Keep the store up to date
  watch(
    () => (typeof content === 'string' ? content : content.value),
    (value) => {
      return (
        value &&
        store.importSpecFile(value, 'default', {
          shouldLoad: false,
          documentUrl: configuration.url,
          setCollectionSecurity: true,
          ...configuration,
        })
      )
    },
    { immediate: true },
  )

  // Create the active entities store
  const activeEntitiesStore = createActiveEntitiesStore(store)

  provide(WORKSPACE_SYMBOL, store)
  provide(ACTIVE_ENTITIES_SYMBOL, activeEntitiesStore)

  return {
    store: store,
    activeEntitiesStore,
  }
}
