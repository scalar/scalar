import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
// import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { onCustomEvent } from '@scalar/workspace-store/events'
import type { Ref } from 'vue'

export const useLegacyStoreEvents = (store: WorkspaceStore, root: Ref<HTMLElement | null>) => {
  const { servers, serverMutators, collectionMutators } = useWorkspace()
  const { activeCollection, activeServer } = useActiveEntities()

  // Keep the old store in sync with the new server selector block
  // This is a temporary solution to keep the old store in sync with the new server selector block
  // When we migrate api-client to the new store we can remove this
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
}
