import type { WorkspaceStore as Legacy } from '@scalar/api-client/store'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { onCustomEvent } from '@scalar/workspace-store/events'
import type { Ref } from 'vue'
import type { createActiveEntitiesStore } from '@scalar/api-client/store'

/**
 * Keep the old store in sync with the new server selector block.
 *
 * This is a temporary solution to maintain consistency between the legacy
 * api-client store and the new workspace store during the migration period.
 *
 * @todo Remove this hook when api-client is fully migrated to the new store
 */
export const useLegacyStoreEvents = (
  store: WorkspaceStore,
  legacyStore: Legacy,
  activeEntities: ReturnType<typeof createActiveEntitiesStore>,
  root: Ref<HTMLElement | null>,
) => {
  const { servers, serverMutators, requestMutators, collectionMutators, securitySchemeMutators } = legacyStore
  const { activeCollection, activeServer } = activeEntities

  onCustomEvent(root, 'scalar-replace-servers', ({ detail: { servers: inputServers, options } }) => {
    if (options?.disableOldStoreUpdate === true) {
      return
    }

    const collection = activeCollection.value

    if (!collection) {
      return console.warn('No active collection found')
    }

    collection.servers.forEach((serverUid) => {
      serverMutators.delete(serverUid, collection.uid)
    })

    inputServers.forEach((server) => {
      const result = Object.values(servers).find((s) => s.url === server.url)
      if (result) {
        serverMutators.add(result, collection.uid)
      }
    })

    const lastServer = Object.values(servers).find((s) => s.url === inputServers.at(-1)?.url)
    collectionMutators.edit(collection.uid, 'selectedServerUid', lastServer?.uid)
  })

  onCustomEvent(root, 'scalar-update-selected-server', ({ detail: { value, options } }) => {
    // Do not update old store
    if (options?.disableOldStoreUpdate === true) {
      return
    }

    const collection = activeCollection.value

    if (!collection) {
      return
    }

    const server = Object.values(servers).find((s) => s.url === value)

    if (!server) {
      return
    }

    // Update the collection with the new server
    collectionMutators.edit(collection.uid, 'selectedServerUid', server.uid)
  })

  onCustomEvent(root, 'store-update-selected-server-properties', ({ detail: { key, value, options } }) => {
    if (options?.disableOldStoreUpdate) {
      return
    }

    const server = activeServer.value

    if (!server) {
      return
    }

    serverMutators.edit(server.uid, key, value)
  })

  onCustomEvent(root, 'scalar-update-selected-server-variables', ({ detail: { key, value, options } }) => {
    // Do not update old store
    if (options?.disableOldStoreUpdate === true) {
      return
    }

    const server = activeServer.value

    // If the two stores gets out of sync, we can skip the update since it will create inconsistencies
    // This can happen if the users switches servers in api-client
    // In this case, changes are not propagated to the old store
    if (!server || server.url !== store.workspace.activeDocument?.['x-scalar-active-server']) {
      return
    }

    const variables = server.variables || {}
    variables[key] = { ...variables[key], default: value }

    serverMutators.edit(server.uid, 'variables', variables)
  })

  /** Auth events */
  onCustomEvent(root, 'scalar-select-security-schemes', ({ detail: { uids } }) => {
    const collection = activeCollection.value

    if (!collection) {
      return console.warn('No active collection found')
    }

    // Set the selected security schemes in the legacy store
    collectionMutators.edit(collection.uid, 'selectedSecuritySchemeUids', uids as any)
  })

  onCustomEvent(root, 'scalar-select-operation-security-schemes', ({ detail: { operationUid, uids } }) => {
    requestMutators.edit(operationUid as any, 'selectedSecuritySchemeUids', uids as any)
  })

  onCustomEvent(root, 'scalar-edit-security-scheme', ({ detail: { uid, path, value } }) => {
    securitySchemeMutators.edit(uid as any, path as any, value)
  })

  onCustomEvent(root, 'scalar-add-auth-option', ({ detail: { payload } }) => {
    const collection = activeCollection.value
    if (!collection) {
      return console.warn('No active collection found')
    }

    securitySchemeMutators.add(payload, collection.uid)
  })

  onCustomEvent(root, 'scalar-delete-security-scheme', ({ detail: { uid } }) => {
    const collection = activeCollection.value
    if (!collection) {
      return console.warn('No active collection found')
    }

    securitySchemeMutators.delete(uid as any)
  })
}
