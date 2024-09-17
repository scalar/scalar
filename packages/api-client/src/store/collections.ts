import type { StoreContext } from '@/store/store-context'
import {
  type Collection,
  type CollectionPayload,
  collectionSchema,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { LS_KEYS } from '@scalar/oas-utils/helpers'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

/** Initiate the workspace collections */
export function createStoreCollections(useLocalStorage: boolean) {
  const collections = reactive<Record<string, Collection>>({})
  const collectionMutators = mutationFactory(
    collections,
    reactive({}),
    useLocalStorage && LS_KEYS.COLLECTION,
  )

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
}: StoreContext) {
  const addCollection = (payload: CollectionPayload, workspaceUid: string) => {
    const collection = collectionSchema.parse(payload)
    workspaceMutators.edit(workspaceUid, 'collections', [
      ...workspaces[workspaceUid].collections,
      collection.uid,
    ])
    collectionMutators.add(collection)

    return collection
  }

  const deleteCollection = (collection: Collection, workspace: Workspace) => {
    if (!workspace.uid) return

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
      if (!request) return

      requestMutators.delete(uid)
      request.examples.forEach(
        (e) => requestExamples[e] && requestExampleMutators.delete(e),
      )
    })

    // Remove collection from workspace
    workspaceMutators.edit(
      workspace.uid,
      'collections',
      workspace.collections.filter((uid) => uid !== collection.uid),
    )

    collectionMutators.delete(collection.uid)
  }

  return {
    addCollection,
    deleteCollection,
  }
}
