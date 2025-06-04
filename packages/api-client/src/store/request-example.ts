import type { StoreContext } from '@/store/store-context'
import { type Request, type RequestExample, createExampleFromRequest } from '@scalar/oas-utils/entities/spec'
import { LS_KEYS } from '@scalar/helpers/object/local-storage'
import { iterateTitle } from '@scalar/helpers/string/iterate-title'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

/** Create top level examples storage for the workspace */
export function createStoreRequestExamples(useLocalStorage: boolean) {
  /**
   * Each request has multiple examples associated with it
   * An example is a set of request params that is saved to the example
   * Multiple test cases can each be saved as an example and switched between
   */
  const requestExamples = reactive<Record<string, RequestExample>>({})
  const requestExampleMutators = mutationFactory(
    requestExamples,
    reactive({}),
    useLocalStorage && LS_KEYS.REQUEST_EXAMPLE,
  )

  return {
    requestExamples,
    requestExampleMutators,
  }
}

/** Extended example data that needs store context */
export function extendedExampleDataFactory({
  requestExamples,
  requestExampleMutators,
  requestMutators,
  requests,
}: StoreContext) {
  /** Ensure we add to the base examples as well as the request it is in */
  const addRequestExample = (request: Request, _name?: string) => {
    const name =
      _name ??
      iterateTitle((request.summary ?? 'Example') + ' #1', (t) =>
        request.examples.some((uid) => requestExamples[uid]?.name === t),
      )

    const example = createExampleFromRequest(request, name)

    // Add the example to the store
    requestExampleMutators.add(example)

    // Add the uid to the request
    requestMutators.edit(request.uid, 'examples', [...request.examples, example.uid])

    return example
  }

  /** Ensure we remove from the base as well as from the request it is in */
  const deleteRequestExample = (requestExample: RequestExample) => {
    if (!requestExample.requestUid) {
      return
    }

    // Remove from request
    requestMutators.edit(
      requestExample.requestUid,
      'examples',
      requests[requestExample.requestUid]?.examples.filter((uid) => uid !== requestExample.uid) || [],
    )

    // Remove from base
    requestExampleMutators.delete(requestExample.uid)
  }

  return {
    addRequestExample,
    deleteRequestExample,
  }
}
