import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { findVariables } from '@scalar/helpers/regex/find-variables'

import type { WorkspaceStore } from '@/client'
import type { OperationEvents } from '@/events/definitions/operation'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import type { WorkspaceDocument } from '@/schemas'
import type { ParameterObject } from '@/schemas/v3.1/strict/openapi-document'
import type { ReferenceType } from '@/schemas/v3.1/strict/reference'
import { isContentTypeParameterObject } from '@/schemas/v3.1/strict/type-guards'

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
 * Helper Functions for Path Parameter Synchronization
 * ------------------------------------------------------------------------------------------------ */

/**
 * Creates a map of parameter names to their character positions in a path.
 * Used to detect renamed path parameters by position matching.
 */
const getParameterPositions = (path: string, parameters: readonly string[]): Record<string, number> => {
  const positions: Record<string, number> = {}

  for (const paramName of parameters) {
    const position = path.indexOf(`{${paramName}}`)
    if (position !== -1) {
      positions[paramName] = position
    }
  }

  return positions
}

/**
 * Syncs path parameters when the path changes.
 *
 * Preserves parameter configurations by:
 * 1. Keeping parameters with matching names
 * 2. Renaming parameters at the same position
 * 3. Creating new parameters with empty examples
 * 4. Removing parameters that no longer exist in the new path
 */
const syncParametersForPathChange = (
  newPath: string,
  oldPath: string,
  existingParameters: ReferenceType<ParameterObject>[],
): ReferenceType<ParameterObject>[] => {
  // Extract path parameter names from both paths
  const oldPathParams = findVariables(oldPath, { includePath: true, includeEnv: false }).filter(
    (v): v is string => v !== undefined,
  )
  const newPathParams = findVariables(newPath, { includePath: true, includeEnv: false }).filter(
    (v): v is string => v !== undefined,
  )

  const oldPositions = getParameterPositions(oldPath, oldPathParams)
  const newPositions = getParameterPositions(newPath, newPathParams)

  // Separate path and non-path parameters, keeping original references
  const pathParameters: ReferenceType<ParameterObject>[] = []
  const nonPathParameters: ReferenceType<ParameterObject>[] = []

  for (const param of existingParameters) {
    const resolved = getResolvedRef(param)
    if (resolved?.in === 'path') {
      pathParameters.push(param)
    } else {
      nonPathParameters.push(param)
    }
  }

  // Create a map of existing path parameters by name for quick lookup
  const existingPathParamsByName = new Map<string, ReferenceType<ParameterObject>>()
  for (const param of pathParameters) {
    const resolved = getResolvedRef(param)
    if (resolved?.name) {
      existingPathParamsByName.set(resolved.name, param)
    }
  }

  const usedOldParams = new Set<string>()
  const syncedPathParameters: ReferenceType<ParameterObject>[] = []

  for (const newParamName of newPathParams) {
    // Case 1: Parameter with same name exists - preserve its config
    if (existingPathParamsByName.has(newParamName)) {
      syncedPathParameters.push(existingPathParamsByName.get(newParamName)!)
      usedOldParams.add(newParamName)
      continue
    }

    // Case 2: Check for parameter at same position (likely a rename)
    const newParamPosition = newPositions[newParamName]
    const oldParamAtPosition = oldPathParams.find(
      (oldParam) => oldPositions[oldParam] === newParamPosition && !usedOldParams.has(oldParam),
    )

    if (oldParamAtPosition && existingPathParamsByName.has(oldParamAtPosition)) {
      // Rename: transfer the old parameter's config to the new name
      const oldParam = existingPathParamsByName.get(oldParamAtPosition)!
      const resolved = getResolvedRef(oldParam)
      if (resolved) {
        resolved.name = newParamName
        syncedPathParameters.push(oldParam)
        usedOldParams.add(oldParamAtPosition)
        continue
      }
    }

    // Case 3: New parameter - create with empty examples
    syncedPathParameters.push({
      name: newParamName,
      in: 'path',
    })
  }

  // Return all parameters: synced path parameters + preserved non-path parameters
  return [...syncedPathParameters, ...nonPathParameters]
}

/** ------------------------------------------------------------------------------------------------
 * Operation Draft Mutators
 * ------------------------------------------------------------------------------------------------ */

/**
 * Creates a new operation at a specific path and method in the document.
 * Automatically normalizes the path to ensure it starts with a slash.
 *
 * Returns the normalized path if successful, undefined otherwise.
 *
 * Example:
 * ```ts
 * createOperation(
 *   document,
 *   'users',
 *   'get',
 *   { tags: ['Users'] },
 * )
 * ```
 */
export const createOperation = (
  workspaceStore: WorkspaceStore | null,
  payload: OperationEvents['operation:create:operation'],
): string | undefined => {
  const document = workspaceStore?.workspace.documents[payload.documentName]
  if (!document) {
    payload.callback?.(false)
    return undefined
  }

  const { path, method, operation } = payload

  /** Ensure the path starts with a slash */
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  /** Create the operation in the document */
  if (!document.paths) {
    document.paths = {}
  }

  if (!document.paths[normalizedPath]) {
    document.paths[normalizedPath] = {}
  }

  document.paths[normalizedPath][method] = operation

  payload.callback?.(true)
  return normalizedPath
}

/**
 * Updates the `summary` of an operation.
 * Safely no-ops if the document or operation does not exist.
 *
 * Example:
 * ```ts
 * updateOperationSummary(
 *   document,
 *   {
 *   meta: { method: 'get', path: '/users/{id}' },
 *   payload: { summary: 'Get a single user' },
 * })
 * ```
 */
export const updateOperationSummary = (
  document: WorkspaceDocument | null,
  { meta, payload: { summary } }: OperationEvents['operation:update:summary'],
) => {
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
export const updateOperationMethod = (
  document: WorkspaceDocument | null,
  { meta, payload: { method } }: OperationEvents['operation:update:method'],
) => {
  const operation = getResolvedRef(document?.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    console.error('Operation not found', { meta, document })
    return
  }

  /** Ensure the path exists */
  const path = document?.paths?.[meta.path]
  if (!path) {
    console.error('Path not found', { meta, document })
    return
  }

  path[method] = unpackProxyObject(operation)
  delete path[meta.method]
}

/**
 * Moves the operation to a new path in the document and synchronizes path
 * parameters in `operation.parameters` with the placeholders present in the
 * provided `path` (e.g. `/users/{id}`). When path parameters change,
 * intelligently syncs them by preserving configurations for renamed parameters
 * (detected by position) and existing parameters. Existing non-path parameters
 * are preserved. The operation is removed from the old path location.
 *
 * Example:
 * ```ts
 * updateOperationPath({
 *   document,
 *   meta: { method: 'get', path: '/users/{id}' },
 *   payload: { path: '/users/{userId}' },
 * })
 * ```
 */
export const updateOperationPath = (
  document: WorkspaceDocument | null,
  { meta, payload: { path } }: OperationEvents['operation:update:path'],
) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    return
  }

  // If the path has not changed, no need to move the operation
  if (meta.path === path) {
    return
  }

  // Sync path parameters if either the old or new path has path parameters
  const oldPathParams = findVariables(meta.path, { includePath: true, includeEnv: false }).filter(
    (v): v is string => v !== undefined,
  )
  const newPathParams = findVariables(path, { includePath: true, includeEnv: false }).filter(
    (v): v is string => v !== undefined,
  )

  if (oldPathParams.length > 0 || newPathParams.length > 0) {
    const existingParameters = operation.parameters ?? []
    operation.parameters = syncParametersForPathChange(path, meta.path, existingParameters)
  }

  // Initialize the paths object if it does not exist
  if (!document.paths) {
    document.paths = {}
  }

  // Initialize the new path if it does not exist
  if (!document.paths[path]) {
    document.paths[path] = {}
  }

  // Move the operation to the new path
  document.paths[path][meta.method] = unpackProxyObject(operation)

  // Remove the operation from the old path
  const oldPath = document.paths[meta.path]
  if (oldPath) {
    delete oldPath[meta.method]

    // If the old path has no more operations, remove the path entry
    if (Object.keys(oldPath).length === 0) {
      delete document.paths[meta.path]
    }
  }
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
export const addOperationParameter = (
  document: WorkspaceDocument | null,
  { meta, payload, type }: OperationEvents['operation:add:parameter'],
) => {
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
export const updateOperationParameter = (
  document: WorkspaceDocument | null,
  { meta, type, payload, index }: OperationEvents['operation:update:parameter'],
) => {
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
  if (!parameter) {
    return
  }

  parameter.name = payload.key ?? parameter.name ?? ''

  if (isContentTypeParameterObject(parameter)) {
    // TODO: handle content-type parameters
    return
  }

  if (!parameter.examples) {
    parameter.examples = {}
  }

  const example = getResolvedRef(parameter.examples[meta.exampleKey])

  // Create the example if it doesn't exist
  if (!example) {
    parameter.examples[meta.exampleKey] = {
      value: payload.value ?? '',
      'x-disabled': payload.isEnabled === undefined ? false : !payload.isEnabled,
    }
    return
  }

  // Update existing example value
  example.value = payload.value ?? example?.value ?? ''
  example['x-disabled'] = payload.isEnabled === undefined ? example['x-disabled'] : !payload.isEnabled
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
export const deleteOperationParameter = (
  document: WorkspaceDocument | null,
  { meta, index, type }: OperationEvents['operation:delete:parameter'],
) => {
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
export const deleteAllOperationParameters = (
  document: WorkspaceDocument | null,
  { meta, type }: OperationEvents['operation:delete-all:parameters'],
) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
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
export const updateOperationRequestBodyContentType = (
  document: WorkspaceDocument | null,
  { meta, payload }: OperationEvents['operation:update:requestBody:contentType'],
) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
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
export const updateOperationRequestBodyExample = (
  document: WorkspaceDocument | null,
  { meta, payload, contentType }: OperationEvents['operation:update:requestBody:value'],
) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
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
export const addOperationRequestBodyFormRow = (
  document: WorkspaceDocument | null,
  { meta, payload, contentType }: OperationEvents['operation:add:requestBody:formRow'],
) => {
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
export const updateOperationRequestBodyFormRow = (
  document: WorkspaceDocument | null,
  { meta, index, payload, contentType }: OperationEvents['operation:update:requestBody:formRow'],
) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
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
export const deleteOperationRequestBodyFormRow = (
  document: WorkspaceDocument | null,
  { meta, index, contentType }: OperationEvents['operation:delete:requestBody:formRow'],
) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
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
