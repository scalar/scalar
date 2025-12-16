import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { objectKeys } from '@scalar/helpers/object/object-keys'
import { preventPollution } from '@scalar/helpers/object/prevent-pollution'
import { findVariables } from '@scalar/helpers/regex/find-variables'

import type { WorkspaceStore } from '@/client'
import type { OperationEvents } from '@/events/definitions/operation'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { getOpenapiObject, getOperationEntries } from '@/navigation'
import { getNavigationOptions } from '@/navigation/get-navigation-options'
import { canHaveOrder } from '@/navigation/helpers/get-openapi-object'
import type { WorkspaceDocument } from '@/schemas'
import type { IdGenerator, TraversedOperation, TraversedWebhook, WithParent } from '@/schemas/navigation'
import type { OperationObject, ParameterObject } from '@/schemas/v3.1/strict/openapi-document'
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

  /** Prevent pollution of the path and method */
  preventPollution(normalizedPath)
  preventPollution(method)

  /** Create the operation in the document */
  document.paths[normalizedPath][method] = operation

  // Make sure that we are selecting the new operation server
  const { servers } = operation
  const firstServer = unpackProxyObject(servers?.[0])

  // For now we only support document servers but in the future we might support operation servers
  for (const server of servers ?? []) {
    // If the server does not exist in the document, add it
    if (!document.servers?.some((s) => s.url === server.url)) {
      if (!document.servers) {
        document.servers = []
      }
      document.servers.push(unpackProxyObject(server))
    }
  }

  // Update the selected server to the first server of the created operation
  if (firstServer) {
    document['x-scalar-selected-server'] = firstServer.url
  }

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
 * Updates the order ID of an operation in the sidebar.
 * Used when changing path or method so we do not lose the sidebar ordering
 */
const updateOperationOrderId = ({
  store,
  operation,
  generateId,
  method,
  path,
  entries,
}: {
  store: WorkspaceStore
  operation: OperationObject
  generateId: IdGenerator
  method: HttpMethod
  path: string
  entries: (WithParent<TraversedOperation> | WithParent<TraversedWebhook>)[]
}) => {
  // Loop over the entries and replace the ID in the x-scalar-order with the new ID
  entries?.forEach((entry) => {
    if (!canHaveOrder(entry.parent)) {
      return
    }

    // Ensure we have an x-scalar-order property
    const parentOpenAPIObject = getOpenapiObject({ store, entry: entry.parent })
    if (!parentOpenAPIObject || !('x-scalar-order' in parentOpenAPIObject)) {
      return
    }

    const order = parentOpenAPIObject['x-scalar-order']
    const index = order?.indexOf(entry.id)
    if (!Array.isArray(order) || typeof index !== 'number' || index < 0) {
      return
    }

    const parentTag =
      entry.parent.type === 'tag' && 'name' in parentOpenAPIObject
        ? { tag: parentOpenAPIObject, id: entry.parent.id }
        : undefined

    // Generate the new ID based on whether this is an operation or webhook
    order[index] = generateId({
      type: 'operation',
      path,
      method,
      operation,
      parentId: entry.parent.id,
      parentTag,
    })
  })
}

/**
 * Updates the HTTP method and/or path of an operation and moves it to the new location.
 * This function:
 * 1. Moves the operation from the old method/path to the new method/path under paths
 * 2. Updates x-scalar-order to maintain the operation's position in the sidebar
 * 3. Syncs path parameters when the path changes
 *
 * Safely no-ops if nothing has changed, or if the document or operation does not exist.
 *
 * Example:
 * ```ts
 * updateOperationPathMethod({
 *   document,
 *   store,
 *   meta: { method: 'get', path: '/users' },
 *   payload: { method: 'post', path: '/api/users' },
 * })
 * ```
 */
export const updateOperationPathMethod = (
  document: WorkspaceDocument | null,
  store: WorkspaceStore | null,
  { meta, payload: { method, path } }: OperationEvents['operation:update:pathMethod'],
  callback: OperationEvents['operation:update:pathMethod']['callback'],
): void => {
  const methodChanged = meta.method !== method
  const pathChanged = meta.path !== path

  // If nothing has changed, no need to do anything
  if (!methodChanged && !pathChanged) {
    callback('no-change')
    return
  }

  // Determine the final method and path
  const finalMethod = methodChanged ? method : meta.method
  const finalPath = pathChanged ? path : meta.path

  // Check for conflicts at the target location
  if (document?.paths?.[finalPath]?.[finalMethod]) {
    callback('conflict')
    return
  }

  const documentNavigation = document?.['x-scalar-navigation']
  if (!documentNavigation || !store) {
    console.error('Document or workspace not found', { document })
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    console.error('Operation not found', { meta, document })
    return
  }

  // Sync path parameters if the path has changed
  if (pathChanged) {
    const oldPathParams = findVariables(meta.path, { includePath: true, includeEnv: false }).filter(
      (v): v is string => v !== undefined,
    )
    const newPathParams = findVariables(finalPath, { includePath: true, includeEnv: false }).filter(
      (v): v is string => v !== undefined,
    )

    if (oldPathParams.length > 0 || newPathParams.length > 0) {
      const existingParameters = operation.parameters ?? []
      operation.parameters = syncParametersForPathChange(finalPath, meta.path, existingParameters)
    }
  }

  // Get the document configuration to generate IDs consistently
  const documentConfig = store.getDocumentConfiguration(documentNavigation.name)
  const { generateId } = getNavigationOptions(documentNavigation.name, documentConfig)

  /** Grabs all of the current operation entries for the given path and method */
  const operationEntriesMap = getOperationEntries(documentNavigation)
  const entries = operationEntriesMap.get(`${meta.path}|${meta.method}`)

  // Updates the order ID so we don't lose the sidebar ordering when it rebuilds
  if (entries) {
    updateOperationOrderId({ store, operation, generateId, method: finalMethod, path: finalPath, entries })
  }

  // Initialize the paths object if it does not exist
  if (!document.paths) {
    document.paths = {}
  }

  // Initialize the new path if it does not exist
  if (!document.paths[finalPath]) {
    document.paths[finalPath] = {}
  }

  // Prevent assigning dangerous keys to the path items object
  preventPollution(finalPath)
  preventPollution(meta.path)
  preventPollution(finalMethod)

  // Move the operation to the new location
  document.paths[finalPath][finalMethod] = unpackProxyObject(operation)

  // Remove the operation from the old location
  const oldPathItems = document.paths[meta.path]
  if (oldPathItems && isHttpMethod(meta.method)) {
    delete oldPathItems[meta.method]

    // If the old path has no more operations, remove the path entry
    if (Object.keys(oldPathItems).length === 0) {
      delete document.paths[meta.path]
    }
  }

  callback('success')
}

/**
 * Deletes an operation from the workspace
 *
 * Example:
 * ```ts
 * deleteOperation({
 *   document,
 *   meta: { method: 'get', path: '/users' },
 * })
 * ```
 */
export const deleteOperation = (
  workspace: WorkspaceStore | null,
  { meta, documentName }: OperationEvents['operation:delete:operation'],
) => {
  const document = workspace?.workspace.documents[documentName]
  if (!document) {
    return
  }

  preventPollution(meta.path)
  preventPollution(meta.method)

  delete document.paths?.[meta.path]?.[meta.method]

  // If the path has no more operations, remove the path entry
  if (Object.keys(document.paths?.[meta.path] ?? {}).length === 0) {
    delete document.paths?.[meta.path]
  }
}

/**
 * Deletes an example with the given exampleKey from operation parameters and request body.
 *
 * - Finds the target operation within the specified document and path/method.
 * - Removes example values matching exampleKey from both parameter-level and content-level examples.
 * - Safely no-ops if the document, operation, or request body does not exist.
 */
export const deleteOperationExample = (
  workspace: WorkspaceStore | null,
  { meta: { path, method, exampleKey }, documentName }: OperationEvents['operation:delete:example'],
) => {
  // Find the document in workspace based on documentName
  const document = workspace?.workspace.documents[documentName]
  if (!document) {
    return
  }

  // Get the operation object for the given path and method
  const operation = getResolvedRef(document.paths?.[path]?.[method])
  if (!operation) {
    return
  }

  // Remove the example from all operation parameters
  operation.parameters?.forEach((parameter) => {
    const resolvedParameter = getResolvedRef(parameter)

    // Remove from content-level examples (if parameter uses content)
    if ('content' in resolvedParameter && resolvedParameter.content) {
      Object.values(resolvedParameter.content).forEach((mediaType) => {
        delete mediaType.examples?.[exampleKey]
      })
    }

    // Remove from parameter-level examples
    if ('examples' in resolvedParameter && resolvedParameter.examples) {
      delete resolvedParameter.examples?.[exampleKey]
    }
  })

  // Remove the example from request body content types (if requestBody exists)
  const requestBody = getResolvedRef(operation.requestBody)
  if (!requestBody) {
    return
  }

  // For each media type, remove the example matching exampleKey
  Object.values(requestBody.content ?? {}).forEach((mediaType) => {
    delete mediaType.examples?.[exampleKey]
  })
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
 *   payload: { key: 'q', value: 'john', isDisabled: false },
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
        'x-disabled': Boolean(payload.isDisabled),
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
 *   payload: { value: 'alice', isDisabled: false },
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
      'x-disabled': Boolean(payload.isDisabled),
    }
    return
  }

  // Update existing example value
  example.value = payload.value ?? example?.value ?? ''
  example['x-disabled'] = Boolean(payload.isDisabled ?? example['x-disabled'])
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

  // We cannot call splice on a proxy object, so we unwrap the array and filter it
  operation.parameters = unpackProxyObject(
    operation.parameters?.filter((_, i) => i !== actualIndex),
    { depth: 1 },
  )
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
 * Sets a header parameter value for a specific example key.
 * Creates the header parameter if it does not exist, otherwise updates the existing one.
 *
 * Note: This function does not handle parameters with content (ParameterWithContentObject).
 * Those cases are currently unsupported and will no-op.
 */
export const setHeader = ({
  operation,
  type,
  name,
  value,
  exampleKey,
}: {
  operation: OperationObject
  type: ParameterObject['in']
  name: string
  value: string
  exampleKey: string
}) => {
  // Initialize parameters array if it does not exist
  if (!operation.parameters) {
    operation.parameters = []
  }

  // Find existing header parameter (case-insensitive name match)
  const existingParameter = operation.parameters.find((param) => {
    const resolvedParam = getResolvedRef(param)
    return resolvedParam.name.toLowerCase() === name.toLowerCase() && resolvedParam.in === type
  })

  if (!existingParameter) {
    // Create a new header parameter with the example value
    operation.parameters.push({
      in: type,
      name,
      examples: {
        [exampleKey]: {
          value,
        },
      },
    })
    return
  }

  const resolvedParameter = getResolvedRef(existingParameter)

  // We do not handle parameters with content
  if (isContentTypeParameterObject(resolvedParameter)) {
    return
  }

  // Initialize examples if they do not exist
  if (!resolvedParameter.examples) {
    resolvedParameter.examples = {}
  }

  // Initialize the specific example if it does not exist
  if (!resolvedParameter.examples[exampleKey]) {
    resolvedParameter.examples[exampleKey] = {}
  }

  // Update the example value
  getResolvedRef(resolvedParameter.examples[exampleKey]).value = value
  return
}

const SKIP_CONTENT_TYPE_HEADERS = ['other', 'none']

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

  // Try to also set the content-type header in the operation parameters
  if (!SKIP_CONTENT_TYPE_HEADERS.includes(payload.contentType)) {
    setHeader({
      operation,
      name: 'Content-Type',
      type: 'header',
      exampleKey: meta.exampleKey,
      value: payload.contentType,
    })
  }
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
          isDisabled: false,
        },
      ],
    }
    return
  }

  // Add the new row to the example
  example.value.push({
    name: payload.key ?? '',
    value: payload.value ?? '',
    isDisabled: false,
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

  // Only set the properties that are present in the payload
  for (const key of objectKeys(payload)) {
    if (example.value[index]) {
      preventPollution(key, 'updateOperationRequestBodyFormRow')
      example.value[index][key === 'key' ? 'name' : key] = payload[key]
    }
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

  // We cannot call splice on a proxy object, so we unwrap the array and filter it
  example.value = unpackProxyObject(
    example.value.filter((_, i) => i !== index),
    { depth: 1 },
  )

  if (example.value.length === 0) {
    delete requestBody.content[contentType]!.examples![meta.exampleKey]
  }
}
