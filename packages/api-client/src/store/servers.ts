import type { StoreContext } from '@/store/store-context'
import {
  type Collection,
  type Request,
  type Server,
  type ServerPayload,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import { LS_KEYS } from '@scalar/oas-utils/helpers'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

/** Create storage objects for servers */
export function createStoreServers(useLocalStorage: boolean) {
  const servers = reactive<Record<Server['uid'], Server>>({})

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
  const addServer = (payload: ServerPayload, parentUid: Collection['uid'] | Request['uid']) => {
    const server = serverSchema.parse(payload)
    const collection = collections[parentUid as Collection['uid']]
    const request = requests[parentUid as Request['uid']]

    // Add to collection
    if (collection) {
      collectionMutators.edit(collection.uid, 'servers', [...collection.servers, server.uid])
    }
    // Add to request
    else if (request) {
      requestMutators.edit(request.uid, 'servers', [...request.servers, server.uid])
    }

    // Add to servers
    serverMutators.add(server)

    return server
  }

  /** Delete a server */
  const deleteServer = (serverUid: Server['uid'], collectionUid: Collection['uid']) => {
    if (!collections[collectionUid]) return

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
