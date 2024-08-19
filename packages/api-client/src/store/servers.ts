import { LS_KEYS } from '@/store/local-storage'
import type { StoreContext } from '@/store/store-context'
import { type Server, serverSchema } from '@scalar/oas-utils/entities/spec'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

/** Create storage objects for servers */
export function createStoreServers(useLocalStorage: boolean) {
  const servers = reactive<Record<string, Server>>({})

  const serverMutators = mutationFactory(
    servers,
    reactive({}),
    useLocalStorage && LS_KEYS.SERVER,
  )

  return {
    servers,
    serverMutators,
  }
}

/** Extended mutators and data for servers */
export function extendedServerDataFactory({
  serverMutators,
  collections,
  collectionMutators,
}: StoreContext) {
  /**
   * Add a server
   * If the collectionUid is included it is added to the collection as well
   */
  const addServer = (payload: Server, collectionUid?: string) => {
    const server = serverSchema.parse(payload)

    // Add to collection
    if (collectionUid) {
      collectionMutators.edit(collectionUid, 'servers', [
        ...collections[collectionUid].servers,
        server.uid,
      ])
    }

    // Add to servers
    serverMutators.add(server)
  }

  /** Delete a server */
  const deleteServer = (serverUid: string, collectionUid: string) => {
    // Remove from parent collection
    collectionMutators.edit(
      collectionUid,
      'servers',
      collections[collectionUid].servers.filter((uid) => uid !== serverUid),
    )

    // Remove from servers
    serverMutators.delete(serverUid)
  }

  return {
    addServer,
    deleteServer,
  }
}
