import type { ServerEvents } from '@/events/definitions/server'
import { coerceValue } from '@/schemas/typebox-coerce'
import { type ServerObject, ServerObjectSchema } from '@/schemas/v3.1/strict/openapi-document'
import type { WorkspaceDocument } from '@/schemas/workspace'

/**
 * Adds a new ServerObject to the document.
 *
 * @param document - The document to upsert the server to
 * @param name - The name of the server to add.
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
  if (!document) {
    return undefined
  }

  const parsed = coerceValue(ServerObjectSchema, server)

  // Initialize the servers array if it doesn't exist
  if (!document.servers) {
    document.servers = [parsed]
  }
  // Update the server at the index
  else {
    document.servers[index] = parsed
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
