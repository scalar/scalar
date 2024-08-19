import type { StoreContext } from '@/store/store-context'
import {
  type ExampleRequestBody,
  type Request,
  type RequestExample,
  type RequestExampleParameter,
  type RequestParameter,
  requestExampleParametersSchema,
  requestExampleSchema,
} from '@scalar/oas-utils/entities/spec'
import { iterateTitle } from '@scalar/oas-utils/helpers'
import { getRequestBodyFromOperation } from '@scalar/oas-utils/spec-getters'
import { mutationFactory } from '@scalar/object-utils/mutator-record'
import { reactive } from 'vue'

import { LS_KEYS } from './local-storage'

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
        request.examples.some((uid) => t === requestExamples[uid].name),
      )

    const example = createExampleFromRequest(request, name)

    // Add the example to the store
    requestExampleMutators.add(example)

    // Add the uid to the request
    requestMutators.edit(request.uid, 'examples', [
      ...request.examples,
      example.uid,
    ])

    return example
  }

  /** Ensure we remove from the base as well as from the request it is in */
  const deleteRequestExample = (requestExample: RequestExample) => {
    // Remove from request
    requestMutators.edit(
      requestExample.requestUid,
      'examples',
      requests[requestExample.requestUid].examples.filter(
        (uid) => uid !== requestExample.uid,
      ),
    )

    // Remove from base
    requestExampleMutators.delete(requestExample.uid)
  }

  return {
    addRequestExample,
    deleteRequestExample,
  }
}

// ---------------------------------------------------------------------------
// Example Helpers

/** Create new instance parameter from a request parameter */
export function createParamInstance(param: RequestParameter) {
  const schema = param.schema as any

  /**
   * TODO:
   * - Need better value defaulting here
   * - Need to handle non-string parameters much better
   * - Need to handle unions/array values for schema
   */
  const value = String(schema.default ?? schema?.examples?.[0] ?? '')

  return requestExampleParametersSchema.parse({
    ...schema,
    key: param.name,
    value,
    description: param.description,
    required: param.required,
    /** Initialized all required properties to enabled */
    enabled: !!param.required,
  })
}

/**
 * Create new request example from a request
 * Iterates the name of the example if provided
 */
export function createExampleFromRequest(
  request: Request,
  name: string,
): RequestExample {
  // ---------------------------------------------------------------------------
  // Populate all parameters with an example value
  const parameters: Record<
    'path' | 'cookie' | 'header' | 'query',
    RequestExampleParameter[]
  > = {
    path: [],
    query: [],
    cookie: [],
    header: [],
  }

  // Populated the separated params
  request.parameters.forEach((p) =>
    parameters[p.in].push(createParamInstance(p)),
  )

  // ---------------------------------------------------------------------------
  // Handle request body defaulting for various content type encodings
  const body: ExampleRequestBody = {
    activeBody: 'raw',
    raw: {
      encoding: 'json',
      value: '',
    },
  }

  if (request.requestBody) {
    const requestBody = getRequestBodyFromOperation({
      path: request.path,
      information: {
        requestBody: request.requestBody,
      },
    })

    if (requestBody?.body?.mimeType === 'application/json') {
      body.activeBody = 'raw'
      body.raw = {
        encoding: 'json',
        value: requestBody.body.text ?? JSON.stringify({}),
      }
    }

    if (requestBody?.body?.mimeType === 'application/xml') {
      body.activeBody = 'raw'
      body.raw = {
        encoding: 'xml',
        value: requestBody.body.text ?? '',
      }
    }

    /**
     *  TODO: Are we loading example files from somewhere based on the spec?
     *  How are we handling the body values
     */
    if (requestBody?.body?.mimeType === 'application/octet-stream') {
      body.activeBody = 'binary'
      body.binary = undefined
    }

    /**
     * TODO: How are handling form data examples from the spec
     */
    if (requestBody?.body?.mimeType === 'application/x-www-form-urlencoded') {
      body.activeBody = 'formData'
      body.formData = undefined
    }
  }
  const example = requestExampleSchema.parse({
    requestUid: request.uid,
    parameters,
    name,
    body,
  })

  return example
}
