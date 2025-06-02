import type { StoreContext } from '@/store/store-context'
import {
  type Collection,
  type CollectionPayload,
  type XScalarEnvironment,
  collectionSchema,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { LS_KEYS } from '@scalar/helpers/object/local-storage'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

/** Initiate the workspace collections */
export function createStoreCollections(useLocalStorage: boolean) {
  const collections = reactive<Record<string, Collection>>({})
  const collectionMutators = mutationFactory(collections, reactive({}), useLocalStorage && LS_KEYS.COLLECTION)

  return {
    collections,
    collectionMutators,
  }
}

/** Extended mutators and data for collections that required workspace access */
export function extendedCollectionDataFactory({
  requests,
  requestMutators,
  requestExamples,
  requestExampleMutators,
  workspaces,
  workspaceMutators,
  collections,
  collectionMutators,
  tagMutators,
  serverMutators,
}: StoreContext) {
  const addCollection = (payload: CollectionPayload, workspaceUid: Workspace['uid']) => {
    const collection = collectionSchema.parse(payload)
    const workspace = workspaces[workspaceUid]
    if (workspace) {
      workspaceMutators.edit(workspaceUid, 'collections', [...workspace.collections, collection.uid])
    }

    collectionMutators.add(collection)

    return collection
  }

  const deleteCollection = (collection: Collection, workspace: Workspace) => {
    if (!workspace.uid) {
      return
    }

    if (collections[collection.uid]?.info?.title === 'Drafts') {
      console.warn('The drafts collection cannot be deleted')
      return
    }

    if (Object.values(collections).length === 1) {
      console.warn('You must have at least one collection')
      return
    }

    // Handle data cleanup
    // NOTE: This is only for local memory management; unassociated objects will not be synced

    // Remove all tags
    collection.tags.forEach((uid) => tagMutators.delete(uid))

    // Remove requests
    collection.requests.forEach((uid) => {
      const request = requests[uid]
      if (!request) {
        return
      }

      requestMutators.delete(uid)
      request.examples.forEach((e) => requestExamples[e] && requestExampleMutators.delete(e))
    })

    // Remove servers
    collection.servers.forEach((uid) => {
      if (uid) {
        serverMutators.delete(uid)
      }
    })

    // Remove collection from workspace
    workspaceMutators.edit(
      workspace.uid,
      'collections',
      workspace.collections.filter((uid) => uid !== collection.uid),
    )

    collectionMutators.delete(collection.uid)
  }

  const addCollectionEnvironment = (
    environmentName: string,
    environment: XScalarEnvironment,
    collectionUid: Collection['uid'],
  ) => {
    const collection = collections[collectionUid]
    if (collection) {
      const currentEnvironments = collection['x-scalar-environments'] || {}
      collectionMutators.edit(collectionUid, 'x-scalar-environments', {
        ...currentEnvironments,
        [environmentName]: environment,
      })
    }
  }

  const removeCollectionEnvironment = (environmentName: string, collectionUid: Collection['uid']) => {
    const collection = collections[collectionUid]
    if (collection) {
      const currentEnvironments = collection['x-scalar-environments'] || {}
      if (environmentName in currentEnvironments) {
        delete currentEnvironments[environmentName]
        collectionMutators.edit(collectionUid, 'x-scalar-environments', currentEnvironments)
      }
    }
  }

  return {
    addCollection,
    deleteCollection,
    addCollectionEnvironment,
    removeCollectionEnvironment,
  }
}
