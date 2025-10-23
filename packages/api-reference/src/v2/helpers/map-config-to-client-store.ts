import { createApiClientModal } from '@scalar/api-client/layouts/Modal'
import type { ApiClient } from '@scalar/api-client/libs'
import {
  ACTIVE_ENTITIES_SYMBOL,
  WORKSPACE_SYMBOL,
  createActiveEntitiesStore,
  createWorkspaceStore as createClientStore,
} from '@scalar/api-client/store'
import { mutateSecuritySchemeDiff } from '@scalar/api-client/views/Request/libs'
import { filterSecurityRequirements } from '@scalar/api-client/views/Request/RequestSection'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { getServersFromDocument } from '@scalar/oas-utils/helpers'
import type { ApiReferenceConfigurationRaw, OpenAPIV3_1 } from '@scalar/types'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { emitCustomEvent } from '@scalar/workspace-store/events'
import type { SecurityRequirementObject } from '@scalar/workspace-store/schemas/v3.1/strict/security-requirement'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/security-scheme'
import { type MaybeRefOrGetter, watchDebounced } from '@vueuse/core'
import microdiff from 'microdiff'
import { type Ref, computed, provide, toRaw, toValue, watch } from 'vue'

import { convertSecurityScheme } from '@/helpers/convert-security-scheme'
import { useLegacyStoreEvents } from '@/v2/hooks/use-legacy-store-events'

/**
 * Temporary state mapping factory to handle syncing the client store with the workspace store.
 */
export function mapConfigToClientStore({
  config,
  workspaceStore,
  el,
  root,
  dereferencedDocument,
}: {
  /** Element the client will be mounted to */
  el: Ref<HTMLElement | null>
  /** Root element used to capture custom events on */
  root: Ref<HTMLElement | null>
  /** Configuration object for API client */
  config: MaybeRefOrGetter<ApiReferenceConfigurationRaw>
  /** Instantiated client store */
  workspaceStore: WorkspaceStore
  dereferencedDocument: MaybeRefOrGetter<OpenAPIV3_1.Document | null>
}) {
  /**
   * Legacy API Client Store
   *
   * In a future release this will be removed and the logic merged into the workspace store.
   */
  const store = createClientStore({
    useLocalStorage: false,
    proxyUrl: toValue(config).proxyUrl,
    theme: toValue(config).theme,
    showSidebar: toValue(config).showSidebar,
    hideClientButton: toValue(config).hideClientButton,
    _integration: toValue(config)._integration,
  })

  let client: ApiClient | null = null

  /**
   * Active Entities Store
   * Required while we are migrating to the new store
   */
  const activeEntities = createActiveEntitiesStore(store)

  /** @deprecated Injected to provision api-client */
  provide(WORKSPACE_SYMBOL, store)

  /** @deprecated Injected to provision api-client */
  provide(ACTIVE_ENTITIES_SYMBOL, activeEntities)

  /** Update the old store to keep it in sync with the new store */
  useLegacyStoreEvents(workspaceStore, store, activeEntities, root)

  // ---------------------------------------------------------------------------

  watch(
    el,
    () => {
      console.info(`[CLIENT]: Client element changed. ${el.value ? 'Mounting client...' : 'Unmounting client...'}`)

      if (!el.value) {
        client?.app?.unmount()
        return
      }

      const clientConfig = toValue(config)

      /** Initialize the client */
      const mount = createApiClientModal({
        el: el.value,
        configuration: {
          ...clientConfig,
          plugins:
            typeof clientConfig.onBeforeRequest === 'function'
              ? [
                  () => ({
                    name: 'on-before-request',
                    hooks: {
                      onBeforeRequest: clientConfig.onBeforeRequest,
                    },
                  }),
                ]
              : [],
        },
        store,
      })

      client = mount.client
    },
    {
      immediate: true,
    },
  )

  /**
   * Handle mapping the security schemes to the client store.
   */
  watchDebounced(
    () => toValue(config),
    (newConfig, oldConfig) => {
      if (!oldConfig || !activeEntities.activeCollection.value) {
        return
      }

      microdiff(oldConfig, newConfig).forEach((d) => {
        // Auth - TODO preferredSecurityScheme
        if (d.path[0] === 'authentication') {
          mutateSecuritySchemeDiff(d, activeEntities, store)
        }
      })
    },

    { deep: true, debounce: 300 },
  )

  /**
   * Update the client servers whenever the config or dereferenced document changes.
   * This ensures that the client is always using the correct servers.
   */
  watch(
    [() => toValue(config).servers, () => toValue(dereferencedDocument)?.servers, () => toValue(config).baseServerURL],
    ([newServers], [oldServers]) => {
      if (newServers || oldServers) {
        // Now we either use the new servers or restore the ones from the spec
        const servers = getServersFromDocument(newServers ?? toValue(dereferencedDocument)?.servers, {
          baseServerURL: toValue(config).baseServerURL,
        })

        emitCustomEvent(el.value, 'scalar-replace-servers', {
          servers,
          options: {
            disableOldStoreUpdate: true,
          },
        })
      }
    },
  )

  /**
   * Reset the client workspace whenever the store changes.
   * This avoids the need to handle manually setting the collection or
   * atomically updating the store when the document changes.
   */
  watchDebounced(
    () => toValue(dereferencedDocument),
    (newDocument, oldDocument) => {
      if (!newDocument) {
        return
      }

      // Ensure the document is different
      const diff = microdiff(newDocument, oldDocument || {})
      if (!diff?.length) {
        return
      }

      // If we already have a collection, remove the store
      if (activeEntities.activeCollection.value) {
        client?.resetStore()
      }

      // [re]Import the store
      return store.importSpecFile(undefined, 'default', {
        dereferencedDocument: toRaw(newDocument),
        shouldLoad: true,
        documentUrl: undefined,
        useCollectionSecurity: true,
        ...toValue(config),
      })
    },
  )

  // ---------------------------------------------------------------------------
  // Some compute properties while we migrate

  const { activeCollection, activeEnvVariables, activeEnvironment, activeWorkspace } = activeEntities

  /**
   * Ensure the server is the one selected in the collection
   *
   * @deprecated
   **/
  const activeServer = computed(() => {
    if (!activeCollection.value) {
      return undefined
    }

    if (activeCollection.value.selectedServerUid) {
      const server = store.servers[activeCollection.value.selectedServerUid]
      if (server) {
        return server
      }
    }

    return store.servers[activeCollection.value.servers[0] ?? '']
  })

  /** Gets the security schemes for a target operation */
  const getSecuritySchemes: SecuritySchemeGetter = (operationSecurity, documentSecurity) => {
    return filterSecurityRequirements(
      operationSecurity || documentSecurity || [],
      activeCollection.value?.selectedSecuritySchemeUids || [],
      store.securitySchemes,
    ).map(convertSecurityScheme)
  }

  return {
    activeServer,
    activeEnvVariables,
    activeEnvironment,
    activeWorkspace,
    getSecuritySchemes,
    openClient: (payload: { method: HttpMethod; path: string }) => client?.open(payload),
  }
}

export type SecuritySchemeGetter = (
  operationSecurity: SecurityRequirementObject[] | undefined,
  documentSecurity: SecurityRequirementObject[] | undefined,
) => SecuritySchemeObject[]
