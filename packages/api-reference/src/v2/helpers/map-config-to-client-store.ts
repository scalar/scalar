import { createApiClientModal } from '@scalar/api-client/layouts/Modal'
import type { ApiClient } from '@scalar/api-client/libs'
import {
  ACTIVE_ENTITIES_SYMBOL,
  type WorkspaceStore as ClientStore,
  WORKSPACE_SYMBOL,
  createActiveEntitiesStore,
  useWorkspace,
} from '@scalar/api-client/store'
import { mutateSecuritySchemeDiff } from '@scalar/api-client/views/Request/libs'
import { filterSecurityRequirements } from '@scalar/api-client/views/Request/RequestSection'
import { getServersFromDocument } from '@scalar/oas-utils/helpers'
import type { ApiReferenceConfigurationRaw, OpenAPIV3_1 } from '@scalar/types'
import { emitCustomEvent } from '@scalar/workspace-store/events'
import type { SecurityRequirementObject } from '@scalar/workspace-store/schemas/v3.1/strict/security-requirement'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/security-scheme'
import { type MaybeRefOrGetter, watchDebounced } from '@vueuse/core'
import microdiff from 'microdiff'
import { type Ref, computed, provide, toValue, watch } from 'vue'

import { convertSecurityScheme } from '@/helpers/convert-security-scheme'

export function mapConfigToClientStore({
  config,
  store,
  activeEntities,
  el,
  isIntersectionEnabled,
  dereferencedDocument,
}: {
  /** Element the client will be mounted to */
  el: Ref<HTMLElement | null>
  /** Configuration object for API client */
  config: MaybeRefOrGetter<ApiReferenceConfigurationRaw>
  /** Instantiated client store */
  store: ClientStore
  activeEntities: ReturnType<typeof createActiveEntitiesStore>

  isIntersectionEnabled: Ref<boolean>
  dereferencedDocument: MaybeRefOrGetter<OpenAPIV3_1.Document | null>
}) {
  let client: ApiClient | null = null

  watch(el, () => {
    console.debug(`[CLIENT]: Client element changed. ${el.value ? 'Mounting client...' : 'Unmounting client...'}`)

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
  })

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

      // Disable intersection observer in case there's some jumpiness
      isIntersectionEnabled.value = false
      setTimeout(() => {
        isIntersectionEnabled.value = true
      }, 1000)
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
      store.importSpecFile(undefined, 'default', {
        dereferencedDocument: newDocument,
        shouldLoad: false,
        documentUrl: undefined,
        useCollectionSecurity: true,
        ...toValue(config),
      })
    },
  )
  // ---------------------------------------------------------------------------

  /**
   * Active Entities Store
   * Required while we are migrating to the new store
   */
  const activeEntitiesStore = createActiveEntitiesStore(store)

  /** @deprecated Injected to provision api-client */
  provide(WORKSPACE_SYMBOL, store)

  /** @deprecated Injected to provision api-client */
  provide(ACTIVE_ENTITIES_SYMBOL, activeEntitiesStore)

  // ---------------------------------------------------------------------------
  // Some compute properties while we migrate

  const { activeCollection, activeEnvVariables, activeEnvironment, activeWorkspace } = activeEntitiesStore

  /**
   * Should be removed after we migrate auth selector
   */
  const { securitySchemes, servers } = useWorkspace()

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
      const server = servers[activeCollection.value.selectedServerUid]
      if (server) {
        return server
      }
    }

    return servers[activeCollection.value.servers[0]]
  })

  /** Gets the security schemes for a target operation */
  const getSecuritySchemes: SecuritySchemeGetter = (operationSecurity, documentSecurity) => {
    return filterSecurityRequirements(
      operationSecurity || documentSecurity || [],
      activeCollection.value?.selectedSecuritySchemeUids || [],
      securitySchemes,
    ).map(convertSecurityScheme)
  }

  return { activeServer, activeEnvVariables, activeEnvironment, activeWorkspace, getSecuritySchemes }
}

export type SecuritySchemeGetter = (
  operationSecurity: SecurityRequirementObject[] | undefined,
  documentSecurity: SecurityRequirementObject[] | undefined,
) => SecuritySchemeObject[]
