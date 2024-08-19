import { PathId, fallbackMissingParams } from '@/router'
import { createExampleFromRequest } from '@/store/request-example'
import { type Request, requestSchema } from '@scalar/oas-utils/entities/spec'
import { iterateTitle, schemaModel } from '@scalar/oas-utils/helpers'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { computed, reactive } from 'vue'

import { LS_KEYS } from './local-storage'
import type { StoreContext } from './store-context'

/** Create top level request handlers for a workspace */
export function createStoreRequests(useLocalStorage: boolean) {
  /** Local list of all requests (will be associated with a database collection) */
  const requests = reactive<Record<string, Request>>({})
  const requestMutators = mutationFactory(
    requests,
    reactive({}),
    useLocalStorage && LS_KEYS.REQUEST,
  )

  return {
    requests,
    requestMutators,
  }
}

/**
 * Create the extended mutators for request where access to the workspace is required
 */
export function extendedRequestDataFactory({
  requestExamples,
  requestExampleMutators,
  requestMutators,
  collectionMutators,
  collections,
}: StoreContext) {
  /** Add request */
  const addRequest = (payload: Request, collectionUid: string) => {
    const request = schemaModel(payload, requestSchema, false)
    if (!request) return console.error('INVALID REQUEST DATA', payload)

    // Create the initial example
    const example = createExampleFromRequest(
      request,
      iterateTitle((request.summary ?? 'Example') + ' #1', (t) =>
        request.examples.some((uid) => t === requestExamples[uid].name),
      ),
    )
    request.examples.push(example.uid)

    // Add request and example to the workspace
    requestMutators.add(request)
    requestExampleMutators.add(example)

    // Add the request to the collection
    collectionMutators.edit(collectionUid, 'requests', [
      ...collections[collectionUid].requests,
      request.uid,
    ])

    return request
  }

  /** Delete request */
  const deleteRequest = (request: Request, collectionUid: string) => {
    // Remove all examples
    request.examples.forEach((uid) => requestExampleMutators.delete(uid))

    // Remove the request from the collection
    collectionMutators.edit(
      collectionUid,
      'requests',
      collections[collectionUid].requests.filter((r) => r !== request.uid),
    )

    // Remove request
    requestMutators.delete(request.uid)
  }

  return {
    addRequest,
    deleteRequest,
  }
}
