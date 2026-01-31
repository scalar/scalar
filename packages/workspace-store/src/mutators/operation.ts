import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { preventPollution } from '@scalar/helpers/object/prevent-pollution'
import { findVariables } from '@scalar/helpers/regex/find-variables'

import type { WorkspaceStore } from '@/client'
import type { HooksEvents } from '@/events/definitions/hooks'
import type { OperationEvents } from '@/events/definitions/operation'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { fetchRequestToHar } from '@/mutators/fetch-request-to-har'
import { fetchResponseToHar } from '@/mutators/fetch-response-to-har'
import { harToOperation } from '@/mutators/har-to-operation'
import { getOpenapiObject, getOperationEntries } from '@/navigation'
import { getNavigationOptions } from '@/navigation/get-navigation-options'
import { canHaveOrder } from '@/navigation/helpers/get-openapi-object'
import type { WorkspaceDocument } from '@/schemas'
import type { DisableParametersConfig } from '@/schemas/extensions/operation/x-scalar-disable-parameters'
import type { IdGenerator, TraversedOperation, TraversedWebhook, WithParent } from '@/schemas/navigation'
import type { ExampleObject, OperationObject, ParameterObject } from '@/schemas/v3.1/strict/openapi-document'
import type { ReferenceType } from '@/schemas/v3.1/strict/reference'
import { isContentTypeParameterObject } from '@/schemas/v3.1/strict/type-guards'

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

  // Separate path and non-path parameters, resolving each parameter only once
  const pathParameters: ParameterObject[] = []
  const nonPathParameters: ReferenceType<ParameterObject>[] = []

  for (const param of existingParameters) {
    const resolved = getResolvedRef(param)
    if (resolved?.in === 'path') {
      pathParameters.push(resolved)
    } else {
      nonPathParameters.push(param)
    }
  }

  // Create a map of existing path parameters by name for quick lookup
  const existingPathParamsByName = new Map<string, ParameterObject>()
  for (const param of pathParameters) {
    if (param.name) {
      existingPathParamsByName.set(param.name, param)
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

    // Rename: transfer the old parameter's config to the new name
    if (oldParamAtPosition && existingPathParamsByName.has(oldParamAtPosition)) {
      const oldParam = existingPathParamsByName.get(oldParamAtPosition)!
      oldParam.name = newParamName
      syncedPathParameters.push(oldParam)
      usedOldParams.add(oldParamAtPosition)
      continue
    }

    // Case 3: New parameter - create with empty examples
    syncedPathParameters.push({
      name: newParamName,
      in: 'path',
    })
  }

  // Return all parameters: synced path parameters + preserved non-path parameters
  return unpackProxyObject([...syncedPathParameters, ...nonPathParameters], { depth: 1 })
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
  { meta, payload: { method, path }, callback }: OperationEvents['operation:update:pathMethod'],
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
  if (document?.paths?.[finalPath]?.[finalMethod as HttpMethod]) {
    callback('conflict')
    return
  }

  const documentNavigation = document?.['x-scalar-navigation']
  if (!documentNavigation || !store) {
    console.error('Document or workspace not found', { document })
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method as HttpMethod])
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

  /**
   * We don't pass navigation options as we don't have config on the client,
   * and we don't change path or method on the references
   */
  const { generateId } = getNavigationOptions(documentNavigation.name)

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

  // We need to reset the history for the operation when the path or method changes
  store.history.clearOperationHistory(document['x-scalar-navigation']?.name ?? '', meta.path, meta.method)

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
export const upsertOperationParameter = (
  document: WorkspaceDocument | null,
  { meta, type, payload, originalParameter }: OperationEvents['operation:upsert:parameter'],
) => {
  // We are editing an existing parameter
  if (originalParameter) {
    originalParameter.name = payload.name

    if (isContentTypeParameterObject(originalParameter)) {
      // TODO: handle content-type parameters
      return
    }

    if (!originalParameter.examples) {
      originalParameter.examples = {}
    }

    // Create the example if it doesn't exist
    originalParameter.examples[meta.exampleKey] ||= {}
    const example = getResolvedRef(originalParameter.examples[meta.exampleKey])!

    // Update the example value and disabled state
    example.value = payload.value
    example['x-disabled'] = payload.isDisabled
    return
  }

  // We are adding a new parameter
  const operation = getResolvedRef(document?.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    console.error('Operation not found', { meta, document })
    return
  }

  operation.parameters ||= []
  operation.parameters.push({
    name: payload.name,
    in: type,
    required: type === 'path' ? true : false,
    examples: {
      [meta.exampleKey]: {
        value: payload.value,
        // We always want a new parameter to be enabled by default
        'x-disabled': false,
      },
    },
  })
  return
}

/**
 * Updates the disabled state of a default parameter for an operation.
 * Default parameters are inherited from higher-level configurations (like collection or server defaults)
 * and this allows individual operations to selectively disable them without removing them entirely.
 *
 * The disabled state is stored in the `x-scalar-disable-parameters` extension object, organized by
 * parameter type and example key. Missing objects are initialized automatically.
 *
 * @param document - The current workspace document
 * @param type - The parameter type (e.g., 'header'). Determines the storage key ('default-headers' for headers)
 * @param meta.path - Path of the operation (e.g., '/users')
 * @param meta.method - HTTP method of the operation (e.g., 'get')
 * @param meta.exampleKey - Key identifying the relevant example
 * @param meta.key - The specific parameter key being updated
 * @param payload.isDisabled - Whether the parameter should be disabled
 */
export const updateOperationExtraParameters = (
  document: WorkspaceDocument | null,
  { type, meta, payload, in: location }: OperationEvents['operation:update:extra-parameters'],
) => {
  type Type = OperationEvents['operation:update:extra-parameters']['type']
  type In = OperationEvents['operation:update:extra-parameters']['in']

  // Ensure there's a valid document
  if (!document) {
    return
  }

  // Resolve the referenced operation from the document using the path and method
  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    return
  }

  // Initialize the 'x-scalar-disable-parameters' object if it doesn't exist
  if (!operation['x-scalar-disable-parameters']) {
    operation['x-scalar-disable-parameters'] = {}
  }

  /**
   * Maps parameter type and location to the corresponding config key.
   * Only valid combinations are defined here.
   */
  const mapping: Partial<Record<Type, Partial<Record<In, keyof DisableParametersConfig>>>> = {
    global: { cookie: 'global-cookies' },
    default: { header: 'default-headers' },
  }

  const key = mapping[type]?.[location]

  if (!key) {
    return
  }

  // Initialize the 'default-headers' object within 'x-scalar-disable-parameters' if it doesn't exist
  if (!operation['x-scalar-disable-parameters'][key]) {
    operation['x-scalar-disable-parameters'][key] = {}
  }

  // Update (or create) the entry for the specific example and key, preserving any existing settings
  operation['x-scalar-disable-parameters'][key][meta.exampleKey] = {
    ...(operation['x-scalar-disable-parameters'][key][meta.exampleKey] ?? {}),
    [meta.name]: payload.isDisabled ?? false,
  }
}

/**
 * Removes a parameter from the operation OR path
 *
 * Example:
 * ```ts
 * deleteOperationParameter({
 *   document,
 *   originalParameter,
 *   meta: { method: 'get', path: '/users', exampleKey: 'default' },
 * })
 * ```
 */
export const deleteOperationParameter = (
  document: WorkspaceDocument | null,
  { meta, originalParameter }: OperationEvents['operation:delete:parameter'],
) => {
  const operation = getResolvedRef(document?.paths?.[meta.path]?.[meta.method])

  // Lets check if its on the operation first as its more likely
  const operationIndex = operation?.parameters?.findIndex((it) => getResolvedRef(it) === originalParameter) ?? -1

  // We cannot call splice on a proxy object, so we unwrap the array and filter it
  if (operation && operationIndex >= 0) {
    operation.parameters = unpackProxyObject(
      operation.parameters?.filter((_, i) => i !== operationIndex),
      { depth: 1 },
    )
    return
  }

  // If it wasn't on the operation it might be on the path
  const path = getResolvedRef(document?.paths?.[meta.path])
  const pathIndex = path?.parameters?.findIndex((it) => getResolvedRef(it) === originalParameter) ?? -1

  if (path && pathIndex >= 0) {
    path.parameters = unpackProxyObject(
      path.parameters?.filter((_, i) => i !== pathIndex),
      { depth: 1 },
    )
  }
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

/** Ensure the json that we need exists up to the example object in the request body */
const findOrCreateRequestBodyExample = (
  document: WorkspaceDocument | null,
  contentType: string,
  meta: OperationEvents['operation:update:requestBody:contentType']['meta'],
): ExampleObject | null => {
  const operation = getResolvedRef(document?.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    return null
  }

  // Ensure that the request body exists
  let requestBody = getResolvedRef(operation.requestBody)
  if (!requestBody) {
    operation.requestBody = {
      content: {},
    }
    requestBody = getResolvedRef(operation.requestBody)
  }

  // Ensure that the example exists
  requestBody.content[contentType] ||= {}
  requestBody.content[contentType].examples ||= {}
  requestBody.content[contentType].examples[meta.exampleKey] ||= {}

  const example = getResolvedRef(requestBody.content[contentType].examples?.[meta.exampleKey])
  return example ?? null
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
  const example = findOrCreateRequestBodyExample(document, contentType, meta)
  if (!example) {
    console.error('Example not found', meta.exampleKey)
    return
  }

  example.value = payload
}

/**
 * Stores the form data for the request body example
 *
 * This needs special handling as we store it as an array of objects with a schema type of object
 */
export const updateOperationRequestBodyFormValue = (
  document: WorkspaceDocument | null,
  { meta, payload, contentType }: OperationEvents['operation:update:requestBody:formValue'],
) => {
  const example = findOrCreateRequestBodyExample(document, contentType, meta)
  if (!example) {
    console.error('Example not found', meta.exampleKey)
    return
  }

  example.value = unpackProxyObject(payload, { depth: 3 })
}

export const addResponseToHistory = async (
  store: WorkspaceStore | null,
  document: WorkspaceDocument | null,
  { payload, meta }: HooksEvents['hooks:on:request:complete'],
) => {
  const documentName = document?.['x-scalar-navigation']?.name
  if (!document || !documentName || !payload) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    return
  }

  const operationParameters = operation.parameters ?? []

  // Get all the variables from the operation parameters
  const variables = operationParameters.reduce<Record<string, string>>((acc, param) => {
    const resolvedParam = getResolvedRef(param)
    if (isContentTypeParameterObject(resolvedParam)) {
      return acc
    }
    if (resolvedParam.in === 'path') {
      acc[resolvedParam.name] = getResolvedRef(resolvedParam.examples?.[meta.exampleKey])?.value ?? ''
    }
    return acc
  }, {})

  const requestHar = await fetchRequestToHar({ request: payload.request })
  const responseHar = await fetchResponseToHar({ response: payload.response })

  store?.history.addHistory(documentName, meta.path, meta.method, {
    response: responseHar,
    request: requestHar,
    meta: {
      example: meta.exampleKey,
    },
    time: payload.duration,
    timestamp: payload.timestamp,
    requestMetadata: {
      variables,
    },
  })
}

export const reloadOperationHistory = (
  store: WorkspaceStore | null,
  document: WorkspaceDocument | null,
  { meta, index, callback }: OperationEvents['operation:reload:history'],
) => {
  if (!document) {
    console.error('Document not found', meta.path, meta.method)
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])
  if (!operation) {
    console.error('Operation not found', meta.path, meta.method)
    return
  }

  const historyItem = store?.history.getHistory(document['x-scalar-navigation']?.name ?? '', meta.path, meta.method)?.[
    index
  ]
  if (!historyItem) {
    console.error('History item not found', index)
    return
  }

  harToOperation({
    harRequest: historyItem.request,
    exampleKey: 'draft',
    baseOperation: operation,
    pathVariables: historyItem.requestMetadata.variables,
  })
  callback('success')
}

export const operationMutatorsFactory = ({
  document,
  store,
}: {
  document: WorkspaceDocument | null
  store: WorkspaceStore | null
}) => {
  return {
    createOperation: (payload: OperationEvents['operation:create:operation']) => createOperation(store, payload),
    updateOperationSummary: (payload: OperationEvents['operation:update:summary']) =>
      updateOperationSummary(document, payload),
    updateOperationPathMethod: (payload: OperationEvents['operation:update:pathMethod']) =>
      updateOperationPathMethod(document, store, payload),
    deleteOperation: (payload: OperationEvents['operation:delete:operation']) => deleteOperation(store, payload),
    deleteOperationExample: (payload: OperationEvents['operation:delete:example']) =>
      deleteOperationExample(store, payload),
    updateOperationExtraParameters: (payload: OperationEvents['operation:update:extra-parameters']) =>
      updateOperationExtraParameters(document, payload),
    upsertOperationParameter: (payload: OperationEvents['operation:upsert:parameter']) =>
      upsertOperationParameter(document, payload),
    deleteOperationParameter: (payload: OperationEvents['operation:delete:parameter']) =>
      deleteOperationParameter(document, payload),
    deleteAllOperationParameters: (payload: OperationEvents['operation:delete-all:parameters']) =>
      deleteAllOperationParameters(document, payload),
    updateOperationRequestBodyContentType: (payload: OperationEvents['operation:update:requestBody:contentType']) =>
      updateOperationRequestBodyContentType(document, payload),
    updateOperationRequestBodyExample: (payload: OperationEvents['operation:update:requestBody:value']) =>
      updateOperationRequestBodyExample(document, payload),
    updateOperationRequestBodyFormValue: (payload: OperationEvents['operation:update:requestBody:formValue']) =>
      updateOperationRequestBodyFormValue(document, payload),
    addResponseToHistory: (payload: HooksEvents['hooks:on:request:complete']) =>
      addResponseToHistory(store, document, payload),
    reloadOperationHistory: (payload: OperationEvents['operation:reload:history']) =>
      reloadOperationHistory(store, document, payload),
  }
}
