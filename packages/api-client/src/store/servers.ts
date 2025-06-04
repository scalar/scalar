import type { StoreContext } from '@/store/store-context'
import {
  type Collection,
  type Request,
  type Server,
  type ServerPayload,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import { LS_KEYS } from '@scalar/helpers/object/local-storage'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

/** Create storage objects for servers */
export function createStoreServers(useLocalStorage: boolean) {
  const servers = reactive<Record<string, Server>>({})

  const serverMutators = mutationFactory(servers, reactive({}), useLocalStorage && LS_KEYS.SERVER)

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
  requests,
  requestMutators,
}: StoreContext) {
  /**
   * Add a server
   * If the collectionUid is included it is added to the collection as well
   */
  const addServer = (payload: ServerPayload, parentUid: string) => {
    const server = serverSchema.parse(payload)

    // Add to collection
    if (collections[parentUid]) {
      collectionMutators.edit(parentUid as Collection['uid'], 'servers', [
        ...collections[parentUid].servers,
        server.uid,
      ])
    }
    // Add to request
    else if (requests[parentUid]) {
      requestMutators.edit(parentUid as Request['uid'], 'servers', [...requests[parentUid].servers, server.uid])
    }

    // Add to servers
    serverMutators.add(server)

    return server
  }

  /** Delete a server */
  const deleteServer = (serverUid: Server['uid'], collectionUid: Collection['uid']) => {
    if (!collections[collectionUid]) {
      return
    }

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
