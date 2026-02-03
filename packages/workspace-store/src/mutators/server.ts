import { findVariables } from '@scalar/helpers/regex/find-variables'

import type { ServerEvents } from '@/events/definitions/server'
import { coerceValue } from '@/schemas/typebox-coerce'
import { type ServerObject, ServerObjectSchema } from '@/schemas/v3.1/strict/openapi-document'
import type { WorkspaceDocument } from '@/schemas/workspace'

/**
 * Adds a new ServerObject to the document.
 *
 * @param document - The document to add the server to
 * @returns the new server object or undefined if the document is not found
 */
export const addServer = (document: WorkspaceDocument | null): ServerObject | undefined => {
  if (!document) {
    return undefined
  }

  const parsed = coerceValue(ServerObjectSchema, {})

  // Initialize the servers array if it doesn't exist
  if (!document.servers) {
    document.servers = []
  }

  document.servers.push(parsed)
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
 * Updates a ServerObject in the document.
 * When the URL changes, intelligently syncs variables by preserving configurations
 * for renamed variables (detected by position) and existing variables.
 *
 * @param document - The document containing the server to update
 * @param index - The index of the server to update
 * @param server - The partial server object with fields to update
 * @returns the updated server object or undefined if the server is not found
 */
export const updateServer = (
  document: WorkspaceDocument | null,
  { index, server }: ServerEvents['server:update:server'],
): ServerObject | undefined => {
  const oldServer = document?.servers?.[index]

  if (!oldServer) {
    console.error('Server not found at index:', index)
    return undefined
  }

  const oldUrl = oldServer.url
  const updatedServer = coerceValue(ServerObjectSchema, { ...oldServer, ...server })

  // Sync variables if the URL changed
  const hasUrlChanged = oldUrl && oldUrl !== updatedServer.url
  if (hasUrlChanged) {
    const existingVariables = updatedServer.variables ?? {}
    updatedServer.variables = syncVariablesForUrlChange(updatedServer.url, oldUrl, existingVariables)

    // If the selected server is the one being updated, set the selected server to the new server
    if (document['x-scalar-selected-server'] === oldUrl) {
      document['x-scalar-selected-server'] = updatedServer.url
    }
  }

  // Ensure servers array exists and update the server at the specified index
  if (!document.servers) {
    document.servers = [updatedServer]
  } else {
    document.servers[index] = updatedServer
  }

  return updatedServer
}

/**
 * Deletes a ServerObject at the specified index from the target array.
 *
 * @param document - The document to delete the server from
 * @param index - The index of the server to delete.
 */
export const deleteServer = (document: WorkspaceDocument | null, { index }: ServerEvents['server:delete:server']) => {
  if (!document?.servers) {
    return
  }

  const url = document.servers[index]?.url
  document.servers.splice(index, 1)

  // If the selected server is the one being deleted, set the selected server to the first one after removal
  if (document['x-scalar-selected-server'] === url) {
    document['x-scalar-selected-server'] = document.servers[0]?.url ?? undefined
  }
}

/**
 * Updates a server variable for the selected server
 *
 * @param document - The document to update the server variables in
 * @param index - The index of the server to update
 * @param key - The key of the variable to update
 * @param value - The new value of the variable
 * @returns the updated variable or undefined if the variable is not found
 */
export const updateServerVariables = (
  document: WorkspaceDocument | null,
  { index, key, value }: ServerEvents['server:update:variables'],
) => {
  const variable = document?.servers?.[index]?.variables?.[key]
  if (!variable) {
    console.error('Variable not found', key, index)
    return
  }

  variable.default = value

  // Now we need to make the url reflect the new variable value
  const url = document?.servers?.[index]?.url
  if (!url) {
    console.error('URL not found', index)
    return
  }

  return variable
}

/**
 * Updates the selected server for the document
 *
 * @param document - The document to update the selected server in
 * @param index - The index of the server to update
 * @returns the url of the selected server or undefined if the server is not found
 */
export const updateSelectedServer = (
  document: WorkspaceDocument | null,
  { url }: ServerEvents['server:update:selected'],
): string | undefined => {
  if (!document) {
    return
  }

  // We are explicitly de-selecting the server
  if (url === '') {
    document['x-scalar-selected-server'] = ''
    return ''
  }

  /**
   * [un]set it and return the url,
   * we specifically use en empty string to indicate that the user has unset the selected server
   */
  document['x-scalar-selected-server'] = document['x-scalar-selected-server'] === url ? '' : url
  return document['x-scalar-selected-server']
}

export const serverMutatorsFactory = ({ document }: { document: WorkspaceDocument | null }) => {
  return {
    addServer: () => addServer(document),
    updateServer: (payload: ServerEvents['server:update:server']) => updateServer(document, payload),
    deleteServer: (payload: ServerEvents['server:delete:server']) => deleteServer(document, payload),
    updateServerVariables: (payload: ServerEvents['server:update:variables']) =>
      updateServerVariables(document, payload),
    updateSelectedServer: (payload: ServerEvents['server:update:selected']) => updateSelectedServer(document, payload),
  }
}
