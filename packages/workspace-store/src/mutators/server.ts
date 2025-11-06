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
 * Updates a ServerObject in the document
 *
 * @param document - The document to upsert the server to
 * @param index - The index of the server to update
 * @param server - The new server payload to be replaced at the index
 * @returns the new server object or undefined if the document is not found
 */
export const updateServer = (
  document: WorkspaceDocument | null,
  { index, server }: ServerEvents['server:update:server'],
): ServerObject | undefined => {
  const oldServer = document?.servers?.[index]
  const oldUrl = oldServer?.url

  if (!oldServer) {
    console.error('Server not found', index)
    return undefined
  }

  const parsed = coerceValue(ServerObjectSchema, { ...oldServer, ...server })

  // Initialize the servers array if it doesn't exist
  if (!document.servers) {
    document.servers = [parsed]
  }
  // Update the server at the index
  else {
    document.servers[index] = parsed
  }

  // Sync the variables of the URL has changed
  if (oldUrl !== parsed.url) {
    /** Find all single curly brace variables in the url */
    const variables = findVariables(parsed.url, { includePath: true, includeEnv: false })
    console.info('variables', variables)
  }

  return parsed
}

/**
 * Deletes a ServerObject at the specified index from the target array.
 *
 * @param document - The document to delete the server from
 * @param index - The index of the server to delete.
 */
export const deleteServer = (document: WorkspaceDocument | null, { index }: ServerEvents['server:delete:server']) =>
  document?.servers?.splice(index, 1)

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
