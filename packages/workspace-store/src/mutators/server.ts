import { getOwnEntry } from '@scalar/helpers/object/get-own-entry'
import { findVariables } from '@scalar/helpers/regex/find-variables'
import type { AsyncApiServerVariableObject } from '@scalar/types/asyncapi/3.1'

import type { ServerEvents, ServerMeta } from '@/events/definitions/server'
import { getPathItemOperation, getPathItemServerTarget } from '@/helpers/for-each-path-item-operation'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { isAsyncApiDocument, isOpenApiDocument } from '@/schemas/type-guards'
import { coerceValue } from '@/schemas/typebox-coerce'
import { type ServerObject, ServerObjectSchema } from '@/schemas/v3.2/strict/openapi-document'
import type { WorkspaceDocument } from '@/schemas/workspace'

/**
 * Documents, path items, and operations hold their own server list and selection.
 */
type ServerTarget = {
  servers?: ServerObject[]
  'x-scalar-selected-server'?: string
}

/**
 * Resolves the writable server target from its scope.
 */
const getServerTarget = (document: WorkspaceDocument | null, meta: ServerMeta): ServerTarget | null => {
  if (!isOpenApiDocument(document)) {
    return null
  }
  if (meta.type === 'document') {
    return document
  }
  const pathItem = getOwnEntry(document.paths, meta.path)
  if (meta.type === 'path') {
    return getPathItemServerTarget(pathItem) ?? null
  }
  return getResolvedRef(getPathItemOperation(pathItem, meta.method)) ?? null
}

/**
 * Initializes the server list for the target.
 *
 * @param document - The document to initialize the servers for
 * @param meta - Owner of the server list
 */
export const initializeServers = (
  document: WorkspaceDocument | null,
  { meta }: ServerEvents['server:initialize:servers'],
) => {
  const target = getServerTarget(document, meta)

  if (!target) {
    console.error('Target not found', meta)
    return undefined
  }
  target.servers = []
  return target.servers
}

/**
 * Adds a new ServerObject to the target server list.
 *
 * @param document - The document to add the server to
 * @returns the new server object or undefined if the target is not found
 */
export const addServer = (
  document: WorkspaceDocument | null,
  { url, select, meta }: ServerEvents['server:add:server'],
): ServerObject | undefined => {
  const target = getServerTarget(document, meta)
  if (!target) {
    console.error('Target not found', meta)
    return undefined
  }

  const parsed = coerceValue(ServerObjectSchema, { url })

  if (!target.servers) {
    target.servers = []
  }
  target.servers.push(parsed)

  if (select) {
    target['x-scalar-selected-server'] = parsed.url
  }

  return parsed
}

/**
 * Creates a map of variable names to their character positions in a URL.
 * Used to detect renamed variables by position matching.
 */
const getVariablePositions = (url: string, variables: readonly string[]): Record<string, number> => {
  const positions: Record<string, number> = {}

  for (const varName of variables) {
    const position = url.indexOf(`{${varName}}`)
    if (position !== -1) {
      positions[varName] = position
    }
  }

  return positions
}

type VariableConfig = {
  description?: string
  default?: string
  enum?: string[]
}

/**
 * Syncs server variables when the URL changes.
 *
 * Preserves variable configurations by:
 * 1. Keeping variables with matching names
 * 2. Renaming variables at the same position
 * 3. Creating new variables with empty defaults
 */
const syncVariablesForUrlChange = (
  newUrl: string,
  oldUrl: string,
  existingVariables: Record<string, VariableConfig>,
): Record<string, VariableConfig> => {
  // Filter out undefined values from findVariables results
  const oldVariables = findVariables(oldUrl, { includePath: true, includeEnv: false }).filter(
    (v): v is string => v !== undefined,
  )
  const newVariables = findVariables(newUrl, { includePath: true, includeEnv: false }).filter(
    (v): v is string => v !== undefined,
  )

  const oldPositions = getVariablePositions(oldUrl, oldVariables)
  const newPositions = getVariablePositions(newUrl, newVariables)

  const usedOldVariables = new Set<string>()
  const syncedVariables: Record<string, VariableConfig> = {}

  for (const newVar of newVariables) {
    // Case 1: Variable with same name exists - preserve its config
    if (existingVariables[newVar]) {
      syncedVariables[newVar] = existingVariables[newVar]
      usedOldVariables.add(newVar)
      continue
    }

    // Case 2: Check for variable at same position (likely a rename)
    const newVarPosition = newPositions[newVar]
    const oldVarAtPosition = oldVariables.find(
      (oldVar) => oldPositions[oldVar] === newVarPosition && !usedOldVariables.has(oldVar),
    )

    if (oldVarAtPosition && existingVariables[oldVarAtPosition]) {
      // Rename: transfer the old variable's config to the new name
      syncedVariables[newVar] = existingVariables[oldVarAtPosition]
      usedOldVariables.add(oldVarAtPosition)
      continue
    }

    // Case 3: New variable - create with empty default
    syncedVariables[newVar] = { default: '' }
  }

  return syncedVariables
}

/**
 * Updates a ServerObject in the target server list.
 * When the URL changes, intelligently syncs variables by preserving configurations
 * for renamed variables (detected by position) and existing variables.
 *
 * @param document - The document containing the server to update
 * @param index - The index of the server to update
 * @param server - The partial server object with fields to update
 * @param meta - Owner of the server list
 * @returns the updated server object or undefined if the server is not found
 */
export const updateServer = (
  document: WorkspaceDocument | null,
  { index, server, meta }: ServerEvents['server:update:server'],
): ServerObject | undefined => {
  const target = getServerTarget(document, meta)
  if (!target) {
    return undefined
  }

  const oldServer = unpackProxyObject(target.servers?.[index], { depth: 1 })
  if (!oldServer) {
    console.error('Server not found at index:', index)
    return undefined
  }

  const oldUrl = oldServer.url
  const updatedServer = coerceValue(ServerObjectSchema, { ...oldServer, ...server })

  const hasUrlChanged = oldUrl && oldUrl !== updatedServer.url
  if (hasUrlChanged) {
    const existingVariables = updatedServer.variables ?? {}
    updatedServer.variables = syncVariablesForUrlChange(updatedServer.url, oldUrl, existingVariables)

    if (target['x-scalar-selected-server'] === oldUrl) {
      target['x-scalar-selected-server'] = updatedServer.url
    }
  }

  if (!target.servers) {
    target.servers = [updatedServer]
  } else {
    target.servers[index] = updatedServer
  }

  return updatedServer
}

/**
 * Deletes a ServerObject at the specified index from the target server list.
 *
 * @param document - The document to delete the server from
 * @param index - The index of the server to delete
 * @param meta - Owner of the server list
 */
export const deleteServer = (
  document: WorkspaceDocument | null,
  { index, meta }: ServerEvents['server:delete:server'],
) => {
  const target = getServerTarget(document, meta)
  if (!target?.servers) {
    return
  }

  const url = target.servers[index]?.url
  target.servers.splice(index, 1)

  if (target['x-scalar-selected-server'] === url) {
    target['x-scalar-selected-server'] = target.servers[0]?.url ?? undefined
  }
}

/**
 * Removes the target server list and clears its selection.
 *
 * @param document - The document to clear the servers from
 * @param meta - Owner of the server list
 */
export const clearServers = (document: WorkspaceDocument | null, { meta }: ServerEvents['server:clear:servers']) => {
  const target = getServerTarget(document, meta)
  if (!target) {
    return
  }
  // Remove the servers array
  target.servers = undefined
  // Clear the selected server
  target['x-scalar-selected-server'] = undefined
}

/**
 * Updates a variable for a server in the target list.
 *
 * @param document - The document to update the server variables in
 * @param index - The index of the server to update
 * @param key - The key of the variable to update
 * @param value - The new value of the variable
 * @param meta - Owner of the server list
 * @returns the updated variable or undefined if the variable is not found
 */
export const updateServerVariables = (
  document: WorkspaceDocument | null,
  { index, key, value, meta }: ServerEvents['server:update:variables'],
) => {
  const target = getServerTarget(document, meta)
  const variable = target?.servers?.[index]?.variables?.[key]
  if (!variable) {
    console.error('Variable not found', key, index)
    return
  }

  variable.default = value
  return variable
}

/**
 * Updates the selection for the target server list.
 *
 * @param document - The document to update the selected server in
 * @param url - The URL of the server to select (or '' to clear)
 * @param meta - Owner of the server list
 * @returns the url of the selected server or undefined if the target is not found
 */
export const updateSelectedServer = (
  document: WorkspaceDocument | null,
  { url, meta }: ServerEvents['server:update:selected'],
): string | undefined => {
  const target = getServerTarget(document, meta)
  if (!target) {
    return
  }

  if (url === '') {
    target['x-scalar-selected-server'] = ''
    return ''
  }

  target['x-scalar-selected-server'] = target['x-scalar-selected-server'] === url ? '' : url
  return target['x-scalar-selected-server']
}

/**
 * Updates the selected server for an AsyncAPI document.
 *
 * AsyncAPI servers are a named map, so the selection is stored as the server
 * name in `x-scalar-selected-server`. There is always an effective server
 * (`getSelectedAsyncApiServer` falls back to the first one), so this simply sets
 * the selection rather than toggling it off.
 *
 * @param document - The document to update the selected server in
 * @param name - The name of the server to select
 * @returns the name of the selected server or undefined if the document is not AsyncAPI
 */
export const updateSelectedAsyncApiServer = (
  document: WorkspaceDocument | null,
  { name }: ServerEvents['asyncapi-server:update:selected'],
): string | undefined => {
  if (!isAsyncApiDocument(document)) {
    return undefined
  }

  document['x-scalar-selected-server'] = name
  return document['x-scalar-selected-server']
}

/**
 * Updates a server variable for an AsyncAPI document, identified by server name.
 *
 * @param document - The document to update the server variables in
 * @param name - The name of the server to update
 * @param key - The key of the variable to update
 * @param value - The new value of the variable
 * @returns the updated variable or undefined if it is not found
 */
export const updateAsyncApiServerVariables = (
  document: WorkspaceDocument | null,
  { name, key, value }: ServerEvents['asyncapi-server:update:variables'],
): AsyncApiServerVariableObject | undefined => {
  if (!isAsyncApiDocument(document)) {
    return undefined
  }

  const server = getResolvedRef(document.servers?.[name])
  const variable = server?.variables?.[key] ? getResolvedRef(server.variables[key]) : undefined
  if (!variable) {
    console.error('Variable not found', key, name)
    return undefined
  }

  variable.default = value
  return variable
}

export const serverMutatorsFactory = ({ document }: { document: WorkspaceDocument | null }) => {
  return {
    initializeServers: (payload: ServerEvents['server:initialize:servers']) => initializeServers(document, payload),
    addServer: (payload: ServerEvents['server:add:server']) => addServer(document, payload),
    updateServer: (payload: ServerEvents['server:update:server']) => updateServer(document, payload),
    deleteServer: (payload: ServerEvents['server:delete:server']) => deleteServer(document, payload),
    clearServers: (payload: ServerEvents['server:clear:servers']) => clearServers(document, payload),
    updateServerVariables: (payload: ServerEvents['server:update:variables']) =>
      updateServerVariables(document, payload),
    updateSelectedServer: (payload: ServerEvents['server:update:selected']) => updateSelectedServer(document, payload),
    updateSelectedAsyncApiServer: (payload: ServerEvents['asyncapi-server:update:selected']) =>
      updateSelectedAsyncApiServer(document, payload),
    updateAsyncApiServerVariables: (payload: ServerEvents['asyncapi-server:update:variables']) =>
      updateAsyncApiServerVariables(document, payload),
  }
}
