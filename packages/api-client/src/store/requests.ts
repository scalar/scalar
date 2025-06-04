import type { extendedTagDataFactory } from '@/store/tags'
import {
  type Collection,
  type Request,
  type RequestPayload,
  type Tag,
  createExampleFromRequest,
  requestSchema,
} from '@scalar/oas-utils/entities/spec'
import { schemaModel } from '@scalar/oas-utils/helpers'
import { LS_KEYS } from '@scalar/helpers/object/local-storage'
import { iterateTitle } from '@scalar/helpers/string/iterate-title'

import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

import type { StoreContext } from './store-context'

/** Create top level request handlers for a workspace */
export function createStoreRequests(useLocalStorage: boolean) {
  /** Local list of all requests (will be associated with a database collection) */
  const requests = reactive<Record<string, Request>>({})
  const requestMutators = mutationFactory(requests, reactive({}), useLocalStorage && LS_KEYS.REQUEST)

  return {
    requests,
    requestMutators,
  }
}

type AddTag = ReturnType<typeof extendedTagDataFactory>['addTag']

/**
 * Create the extended mutators for request where access to the workspace is required
 */
export function extendedRequestDataFactory(
  {
    requestExamples,
    requestExampleMutators,
    requestMutators,
    collectionMutators,
    collections,
    tags,
    tagMutators,
  }: StoreContext,
  // We want the add tag with side effects here so it gets properly added to the colleciton
  addTag: AddTag,
) {
  /** Add request */
  const addRequest = (payload: RequestPayload, collectionUid: Collection['uid']) => {
    const request = schemaModel(payload, requestSchema, false)
    if (!request) {
      return console.error('INVALID REQUEST DATA', payload)
    }

    const collection = collections[collectionUid]

    // Create the initial example
    const example = createExampleFromRequest(
      request,
      iterateTitle((request.summary ?? 'Example') + ' #1', (t) =>
        request.examples.some((uid) => t === requestExamples[uid]?.name),
      ),
    )
    request.examples.push(example.uid)

    // Add request and example to the workspace
    requestMutators.add(request)
    requestExampleMutators.add(example)

    // Add the request to the collection
    if (collection) {
      collectionMutators.edit(collectionUid, 'requests', [...collection.requests, request.uid])
    }

    // Add to the tags
    if (request.tags?.length) {
      request.tags.forEach((tagName) => {
        const tagUid = collection?.tags.find((uid) => tags[uid]?.name === tagName)

        if (tagUid && tags[tagUid]) {
          tagMutators.edit(tagUid, 'children', [...tags[tagUid].children, request.uid])
        }
        // We must add a new tag
        else {
          addTag({ name: tagName, children: [request.uid] }, collectionUid)
        }
      })
    }
    // Add to the collection children if no tags
    else if (collection) {
      collectionMutators.edit(collectionUid, 'children', [...collection.children, request.uid])
    }

    return request
  }

  /** Delete request */
  const deleteRequest = (request: Request, collectionUid: Collection['uid']) => {
    const collection = collections[collectionUid]

    // Remove all examples
    request.examples.forEach((uid) => requestExampleMutators.delete(uid))

    if (collection) {
      // Remove the request from the collection
      collectionMutators.edit(
        collectionUid,
        'requests',
        collection.requests.filter((r) => r !== request.uid),
      )

      // And collection children
      collectionMutators.edit(
        collectionUid,
        'children',
        collection.children.filter((r) => r !== request.uid),
      )

      // And from all tags
      request.tags?.forEach((tagName) => {
        const tagUid = collection.tags.find((uid) => tags[uid]?.name === tagName)
        if (!tagUid) {
          return
        }

        tagMutators.edit(tagUid, 'children', tags[tagUid]?.children.filter((r) => r !== request.uid) || [])
      })
    }

    // Remove request
    requestMutators.delete(request.uid)
  }

  return {
    addRequest,
    deleteRequest,
    findRequestParents: findRequestParentsFactory({ collections, tags }),
  }
}

/** Factory function to allow testing of the function */
export function findRequestParentsFactory({
  collections,
  tags,
}: {
  collections: Record<string, Collection>
  tags: Record<string, Tag>
}) {
  /** Recursively find all parent folders (tags and collections) of a request */
  function findRequestParentss(r: Request) {
    const collection = Object.values(collections).find((c) => c.requests?.includes(r.uid))
    if (!collection) {
      return []
    }

    // Initialized an empty children array for each tag and once for the top level collection
    const tagChildren = Object.keys(tags).reduce<Record<string, string[]>>(
      (obj, uid) => {
        obj[uid] = []
        return obj
      },
      { [collection?.uid]: [] },
    )

    // Recursively add nested children to the tagChildren values
    function addChildren(current: Tag | Collection, parentUids: string[]) {
      parentUids.forEach((p) => tagChildren[p]?.push(...current.children))

      // tagChildren[current.uid].push(...current.children)

      current.children.forEach((t) => {
        if (tags[t]) {
          addChildren(tags[t], [...parentUids, t])
        }
      })
    }
    addChildren(collection, [collection.uid])

    // Return unique parents
    const parents: Set<string> = new Set()

    // Anytime a tag has the request somewhere in its tree we make it open
    Object.entries(tagChildren).forEach(([tagUid, totalChildren]) => {
      if (totalChildren.includes(r.uid)) {
        parents.add(tagUid)
      }
    })
    return [...parents]
  }

  return findRequestParentss
}

/** First draft request" */
export function createInitialRequest() {
  const request = requestSchema.parse({
    method: 'get',
    parameters: [],
    path: '',
    summary: 'My First Request',
    examples: [],
  })

  return { request }
}
