import type { HttpMethod } from '@scalar/helpers/http/http-methods'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { WorkspaceDocument } from '@/schemas'

/**
 * Describes the minimal identity for an operation in the workspace document.
 * It is used by mutators to find the target operation under `paths`.
 *
 * Example:
 * ```ts
 * const meta: OperationMeta = { method: 'get', path: '/users/{id}' }
 * ```
 */
export type OperationMeta = {
  method: HttpMethod
  path: string
}

/**
 * Extends {@link OperationMeta} with an `exampleKey` to address a specific
 * example variant (e.g. per environment or scenario) for request/parameters.
 *
 * Example:
 * ```ts
 * const meta: OperationExampleMeta = {
 *   method: 'post',
 *   path: '/upload',
 *   exampleKey: 'default',
 * }
 * ```
 */
export type OperationExampleMeta = OperationMeta & {
  exampleKey: string
}

/** ------------------------------------------------------------------------------------------------
 * Operation Draft Mutators
 * ------------------------------------------------------------------------------------------------ */

/**
 * Updates the `summary` of an operation.
 * Safely no-ops if the document or operation does not exist.
 *
 * Example:
 * ```ts
 * updateOperationSummary({
 *   document,
 *   meta: { method: 'get', path: '/users/{id}' },
 *   payload: { summary: 'Get a single user' },
 * })
 * ```
 */
export const updateOperationSummary = ({
  document,
  meta,
  payload: { summary },
}: {
  document: WorkspaceDocument | null
  payload: { summary: string }
  meta: OperationMeta
}) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method as HttpMethod])

  if (!operation) {
    return
  }

  operation.summary = summary
}

/**
 * Stores the chosen HTTP method under `x-scalar-method` on the operation.
 * This does not move the operation to a different method slot under `paths`;
 * it records the desired method as an extension for downstream consumers.
 * Safely no-ops if the document or operation does not exist.
 *
 * Example:
 * ```ts
 * updateOperationMethodDraft({
 *   document,
 *   meta: { method: 'get', path: '/users' },
 *   payload: { method: 'post' },
 * })
 * ```
 */
export const updateOperationMethodDraft = ({
  document,
  meta,
  payload: { method },
}: {
  document: WorkspaceDocument | null
  payload: { method: HttpMethod }
  meta: OperationMeta
}) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  if (!operation) {
    return
  }

  operation['x-scalar-method'] = method
}

/**
 * Records a normalized path for the operation under `x-scalar-path`, and
 * synchronizes path parameters in `operation.parameters` with the placeholders
 * present in the provided `path` (e.g. `/users/{id}`). Existing non-path
 * parameters are preserved.
 * Safely no-ops if the document or operation does not exist.
 *
 * Example:
 * ```ts
 * updateOperationPathDraft({
 *   document,
 *   meta: { method: 'get', path: '/users/{id}' },
 *   payload: { path: '/users/{id}' },
 * })
 * ```
 */
export const updateOperationPathDraft = ({
  document,
  meta,
  payload: { path },
}: {
  document: WorkspaceDocument | null
  payload: { path: string }
  meta: OperationMeta
}) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  if (!operation) {
    return
  }

  operation['x-scalar-path'] = path

  // Extract the path variables from the path
  const pathVariables = Array.from(path.matchAll(/{([^\/}]+)}/g), (m) => m[1])

  // now we need to update the operation path variables
  const pathVariablesWithoutPathParameters = operation.parameters?.filter((it) => getResolvedRef(it).in !== 'path')

  operation.parameters = [
    ...(pathVariablesWithoutPathParameters ?? []),
    ...pathVariables.map((it) => ({
      name: it ?? '',
      in: 'path' as const,
      required: true,
    })),
  ]
}

/** ------------------------------------------------------------------------------------------------
 * Operation Parameters Mutators
 * ------------------------------------------------------------------------------------------------ */

/**
 * Adds a parameter to the operation with an example value tracked by `exampleKey`.
 * For `path` parameters `required` is set to true automatically.
 * Safely no-ops if the document or operation does not exist.
 *
 * Example:
 * ```ts
 * addOperationParameter({
 *   document,
 *   type: 'query',
 *   meta: { method: 'get', path: '/search', exampleKey: 'default' },
 *   payload: { key: 'q', value: 'john', isEnabled: true },
 * })
 * ```
 */
export const addOperationParameter = ({
  document,
  meta,
  payload,
  type,
}: {
  document: WorkspaceDocument | null
  type: 'header' | 'path' | 'query' | 'cookie'
  payload: {
    key: string
    value: string
    isEnabled: boolean
  }
  meta: OperationExampleMeta
}) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  // Initialize parameters array if it doesn't exist
  if (!operation.parameters) {
    operation.parameters = []
  }

  // Add the new parameter
  operation.parameters.push({
    name: payload.key,
    in: type,
    required: type === 'path' ? true : false,
    examples: {
      [meta.exampleKey]: {
        value: payload.value,
        'x-disabled': !payload.isEnabled,
      },
    },
  })
}

/**
 * Updates an existing parameter of a given `type` by its index within that
 * type subset (e.g. the N-th query parameter). Supports updating name, value,
 * and enabled state for the targeted example.
 * Safely no-ops if the document, operation, or parameter does not exist.
 *
 * Example:
 * ```ts
 * updateOperationParameter({
 *   document,
 *   type: 'query',
 *   index: 0,
 *   meta: { method: 'get', path: '/search', exampleKey: 'default' },
 *   payload: { value: 'alice', isEnabled: true },
 * })
 * ```
 */
export const updateOperationParameter = ({
  document,
  meta,
  type,
  payload,
  index,
}: {
  document: WorkspaceDocument | null
  type: 'header' | 'path' | 'query' | 'cookie'
  index: number
  payload: Partial<{
    key: string
    value: string
    isEnabled: boolean
  }>
  meta: OperationExampleMeta
}) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  // Get all resolved parameters of the specified type
  // The passed index corresponds to this filtered list
  const resolvedParameters = operation.parameters?.map((it) => getResolvedRef(it)).filter((it) => it.in === type) ?? []
  const parameter = resolvedParameters[index]

  // Don't proceed if parameter doesn't exist
  if (!parameter) {
    return
  }

  parameter.name = payload.key ?? parameter.name ?? ''

  // TODO: handle content-type parameters
  if ('examples' in parameter) {
    if (!parameter.examples) {
      parameter.examples = {}
    }

    const example = getResolvedRef(parameter.examples[meta.exampleKey])

    if (!example) {
      return
    }

    example.value = payload.value ?? example?.value ?? ''
    example['x-disabled'] = payload.isEnabled === undefined ? example['x-disabled'] : !payload.isEnabled
  }
}

/**
 * Removes a parameter from the operation by resolving its position within
 * the filtered list of parameters of the specified `type`.
 * Safely no-ops if the document, operation, or parameter does not exist.
 *
 * Example:
 * ```ts
 * deleteOperationParameter({
 *   document,
 *   type: 'header',
 *   index: 1,
 *   meta: { method: 'get', path: '/users', exampleKey: 'default' },
 * })
 * ```
 */
export const deleteOperationParameter = ({
  document,
  meta,
  index,
  type,
}: {
  document: WorkspaceDocument | null
  type: 'header' | 'path' | 'query' | 'cookie'
  index: number
  meta: OperationExampleMeta
}) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  // Translate the index from the filtered list to the actual parameters array
  const resolvedParameters = operation.parameters?.map((it) => getResolvedRef(it)).filter((it) => it.in === type) ?? []
  const parameter = resolvedParameters[index]

  // Don't proceed if parameter doesn't exist
  if (!parameter) {
    return
  }

  const actualIndex = operation.parameters?.findIndex((it) => getResolvedRef(it) === parameter) as number

  // Remove the parameter from the operation
  operation.parameters?.splice(actualIndex, 1)
}

/**
 * Deletes all parameters of a given `type` from the operation.
 * Safely no-ops if the document or operation does not exist.
 *
 * Example:
 * ```ts
 * deleteAllOperationParameters({
 *   document,
 *   type: 'cookie',
 *   meta: { method: 'get', path: '/users' },
 * })
 * ```
 */
export const deleteAllOperationParameters = ({
  document,
  meta,
  type,
}: {
  document: WorkspaceDocument | null
  type: 'header' | 'path' | 'query' | 'cookie'
  meta: OperationMeta
}) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  // Filter out parameters of the specified type
  operation.parameters = operation.parameters?.filter((it) => getResolvedRef(it).in !== type) ?? []
}

/** ------------------------------------------------------------------------------------------------
 * Operation Request Body Mutators
 * ------------------------------------------------------------------------------------------------ */

/**
 * Sets the selected request-body content type for the current `exampleKey`.
 * This stores the selection under `x-scalar-selected-content-type` on the
 * resolved requestBody. Safely no-ops if the document or operation does not exist.
 *
 * Example:
 * ```ts
 * updateOperationRequestBodyContentType({
 *   document,
 *   meta: { method: 'post', path: '/upload', exampleKey: 'default' },
 *   payload: { contentType: 'multipart/form-data' },
 * })
 * ```
 */
export const updateOperationRequestBodyContentType = ({
  document,
  meta,
  payload,
}: {
  document: WorkspaceDocument | null
  payload: {
    contentType: string
  }
  meta: OperationExampleMeta
}) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  let requestBody = getResolvedRef(operation.requestBody)

  if (!requestBody) {
    operation.requestBody = {
      content: {},
    }
    requestBody = getResolvedRef(operation.requestBody)
  }

  if (!requestBody!['x-scalar-selected-content-type']) {
    requestBody!['x-scalar-selected-content-type'] = {}
  }

  requestBody!['x-scalar-selected-content-type'][meta.exampleKey] = payload.contentType
}

/**
 * Creates or updates a concrete example value for a specific request-body
 * `contentType` and `exampleKey`. Safely no-ops if the document or operation
 * does not exist.
 *
 * Example:
 * ```ts
 * updateOperationRequestBodyExample({
 *   document,
 *   contentType: 'application/json',
 *   meta: { method: 'post', path: '/users', exampleKey: 'default' },
 *   payload: { value: JSON.stringify({ name: 'Ada' }) },
 * })
 * ```
 */
export const updateOperationRequestBodyExample = ({
  document,
  meta,
  payload,
  contentType,
}: {
  document: WorkspaceDocument | null
  contentType: string
  payload: {
    value: string | File | undefined
  }
  meta: OperationExampleMeta
}) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  let requestBody = getResolvedRef(operation.requestBody)

  if (!requestBody) {
    operation.requestBody = {
      content: {},
    }
    requestBody = getResolvedRef(operation.requestBody)
  }

  if (!requestBody!.content[contentType]) {
    requestBody!.content[contentType] = {
      examples: {},
    }
  }

  // Ensure examples object exists and get a resolved reference
  const mediaType = requestBody!.content[contentType]!
  mediaType.examples ??= {}
  const examples = getResolvedRef(mediaType.examples)!

  const example = getResolvedRef(examples[meta.exampleKey])

  if (!example) {
    examples[meta.exampleKey] = {
      value: payload.value,
    }
    return
  }

  example.value = payload.value
}

/**
 * Appends a form-data row to the request-body example identified by
 * `contentType` and `exampleKey`. Initializes the example as an array when
 * needed. Safely no-ops if the document or operation does not exist.
 *
 * Example:
 * ```ts
 * addOperationRequestBodyFormRow({
 *   document,
 *   contentType: 'multipart/form-data',
 *   meta: { method: 'post', path: '/upload', exampleKey: 'default' },
 *   payload: { key: 'file', value: new File(['x'], 'a.txt') },
 * })
 * ```
 */
export const addOperationRequestBodyFormRow = ({
  document,
  meta,
  payload,
  contentType,
}: {
  document: WorkspaceDocument | null
  payload: Partial<{ key: string; value?: string | File }>
  contentType: string
  meta: OperationExampleMeta
}) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  let requestBody = getResolvedRef(operation.requestBody)

  if (!requestBody) {
    operation.requestBody = {
      content: {},
    }
    requestBody = getResolvedRef(operation.requestBody)
  }

  if (!requestBody!.content[contentType]) {
    requestBody!.content[contentType] = {
      examples: {},
    }
  }

  if (!requestBody!.content[contentType]!.examples) {
    requestBody!.content[contentType]!.examples = {}
  }

  const examples = getResolvedRef(requestBody!.content[contentType]!.examples)

  const example = getResolvedRef(examples[meta.exampleKey])

  if (!example || !Array.isArray(example.value)) {
    examples[meta.exampleKey] = {
      value: [
        {
          name: payload.key,
          value: payload.value,
        },
      ],
    }
    return
  }

  // Add the new row to the example
  example.value.push({
    name: payload.key ?? '',
    value: payload.value ?? '',
  })
}

/**
 * Updates a form-data row at a given `index` for the specified example and
 * `contentType`. Setting `payload.value` to `null` clears the value (sets to
 * `undefined`). Safely no-ops if the document, operation, or example does not exist.
 *
 * Example:
 * ```ts
 * updateOperationRequestBodyFormRow({
 *   document,
 *   index: 0,
 *   contentType: 'multipart/form-data',
 *   meta: { method: 'post', path: '/upload', exampleKey: 'default' },
 *   payload: { key: 'description', value: 'Profile picture' },
 * })
 * ```
 */
export const updateOperationRequestBodyFormRow = ({
  document,
  meta,
  index,
  payload,
  contentType,
}: {
  document: WorkspaceDocument | null
  index: number
  payload: Partial<{ key: string; value: string | File | null }>
  contentType: string
  meta: OperationExampleMeta
}) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  let requestBody = getResolvedRef(operation.requestBody)

  if (!requestBody) {
    operation.requestBody = {
      content: {},
    }
    requestBody = getResolvedRef(operation.requestBody)
  }

  if (!requestBody!.content[contentType]) {
    return
  }

  const examples = getResolvedRef(requestBody!.content[contentType]!.examples)

  if (!examples) {
    return
  }

  const example = getResolvedRef(examples[meta.exampleKey])

  if (!example || !Array.isArray(example.value)) {
    return
  }

  example.value[index] = {
    name: payload.key ?? example.value[index]?.name ?? '',
    value: payload.value === null ? undefined : (payload.value ?? example.value[index]?.value ?? ''),
  }
}

/**
 * Deletes a form-data row at a given `index` from the example for the given
 * `contentType`. If the example becomes empty, the example entry is removed.
 * Safely no-ops if the document, operation, example, or row does not exist.
 *
 * Example:
 * ```ts
 * deleteOperationRequestBodyFormRow({
 *   document,
 *   index: 0,
 *   contentType: 'multipart/form-data',
 *   meta: { method: 'post', path: '/upload', exampleKey: 'default' },
 * })
 * ```
 */
export const deleteOperationRequestBodyFormRow = ({
  document,
  meta,
  index,
  contentType,
}: {
  document: WorkspaceDocument | null
  index: number
  contentType: string
  meta: OperationExampleMeta
}) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  const requestBody = getResolvedRef(operation.requestBody)

  if (!requestBody) {
    return
  }

  if (!requestBody.content[contentType]) {
    return
  }

  const examples = getResolvedRef(requestBody.content[contentType]!.examples)

  if (!examples) {
    return
  }

  const example = getResolvedRef(examples[meta.exampleKey])

  if (!example || !Array.isArray(example.value)) {
    return
  }

  example.value.splice(index, 1)

  if (example.value.length === 0) {
    delete requestBody.content[contentType]!.examples![meta.exampleKey]
  }
}
