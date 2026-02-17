import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { preventPollution } from '@scalar/helpers/object/prevent-pollution'
import { findVariables } from '@scalar/helpers/regex/find-variables'

import type { WorkspaceStore } from '@/client'
import type { OperationEvents } from '@/events/definitions/operation'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { syncParametersForPathChange } from '@/mutators/operation/helpers/sync-path-parameters'
import { getOperationEntries } from '@/navigation'
import { getNavigationOptions } from '@/navigation/get-navigation-options'
import { updateOrderIds } from '@/navigation/helpers/update-order-ids'
import type { WorkspaceDocument } from '@/schemas'

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

  // Sync path variables
  const newParameters = syncParametersForPathChange(normalizedPath, normalizedPath, operation.parameters ?? [])
  if (newParameters.length > 0) {
    operation.parameters = newParameters
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
    updateOrderIds({ store, operation, generateId, method: finalMethod, path: finalPath, entries })
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
