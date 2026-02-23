import { findVariables } from '@scalar/helpers/regex/find-variables'

import type { ServerEvents, ServerMeta } from '@/events/definitions/server'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import { coerceValue } from '@/schemas/typebox-coerce'
import { type ServerObject, ServerObjectSchema } from '@/schemas/v3.1/strict/openapi-document'
import type { WorkspaceDocument } from '@/schemas/workspace'

/**
 * Target for server mutators: has a servers array and optional selected-server storage.
 * Document and (resolved) operation both have this shape.
 */
type ServerTarget = {
  servers?: ServerObject[]
  'x-scalar-selected-server'?: string
}

/**
 * Resolves the server target (document or operation) from meta.
 * Document-level servers live on the document; operation-level servers on the operation object.
 */
const getServerTarget = (document: WorkspaceDocument | null, meta: ServerMeta): ServerTarget | null => {
  if (!document) {
    return null
  }
  if (meta.type === 'document') {
    return document
  }
  return getResolvedRef(document.paths?.[meta.path]?.[meta.method]) ?? null
}

/**
 * Adds a new ServerObject to the document or operation based on meta.
 *
 * @param document - The document to add the server to
 * @returns the new server object or undefined if the target is not found
 */
export const addServer = (
  document: WorkspaceDocument | null,
  { meta }: ServerEvents['server:add:server'],
): ServerObject | undefined => {
  const target = getServerTarget(document, meta)
  if (!target) {
    console.error('Target not found', meta)
    return undefined
  }

  const parsed = coerceValue(ServerObjectSchema, {})

  if (!target.servers) {
    target.servers = []
  }
  target.servers.push(parsed)
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
 * Updates a ServerObject in the document or operation based on meta.
 * When the URL changes, intelligently syncs variables by preserving configurations
 * for renamed variables (detected by position) and existing variables.
 *
 * @param document - The document containing the server to update
 * @param index - The index of the server to update
 * @param server - The partial server object with fields to update
 * @param meta - Target context (document or operation)
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
 * Deletes a ServerObject at the specified index from the document or operation based on meta.
 *
 * @param document - The document to delete the server from
 * @param index - The index of the server to delete
 * @param meta - Target context (document or operation)
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
 * Clears all servers from the document or operation based on meta.
 *
 * @param document - The document to clear the servers from
 * @param meta - Target context (document or operation)
 */
export const clearServers = (document: WorkspaceDocument | null, { meta }: ServerEvents['server:clear:servers']) => {
  const target = getServerTarget(document, meta)
  if (!target) {
    return
  }
  // Remove the servers array
  delete target.servers
  // Clear the selected server
  delete target['x-scalar-selected-server']
}

/**
 * Updates a server variable for the document or operation based on meta.
 *
 * @param document - The document to update the server variables in
 * @param index - The index of the server to update
 * @param key - The key of the variable to update
 * @param value - The new value of the variable
 * @param meta - Target context (document or operation)
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
 * Updates the selected server for the document or operation based on meta.
 *
 * @param document - The document to update the selected server in
 * @param url - The URL of the server to select (or '' to clear)
 * @param meta - Target context (document or operation)
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

export const serverMutatorsFactory = ({ document }: { document: WorkspaceDocument | null }) => {
  return {
    addServer: (payload: ServerEvents['server:add:server']) => addServer(document, payload),
    updateServer: (payload: ServerEvents['server:update:server']) => updateServer(document, payload),
    deleteServer: (payload: ServerEvents['server:delete:server']) => deleteServer(document, payload),
    clearServers: (payload: ServerEvents['server:clear:servers']) => clearServers(document, payload),
    updateServerVariables: (payload: ServerEvents['server:update:variables']) =>
      updateServerVariables(document, payload),
    updateSelectedServer: (payload: ServerEvents['server:update:selected']) => updateSelectedServer(document, payload),
  }
}
