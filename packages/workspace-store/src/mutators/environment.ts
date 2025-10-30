import type { Workspace, WorkspaceDocument } from '@/schemas'
import { type XScalarEnvironment, xScalarEnvironmentSchema } from '@/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@/schemas/typebox-coerce'

/**
 * Adds OR updates an environment to the document or workspace.
 *
 * @param collection - Workspace OR document
 * @param name - The name of the environment to add
 * @param environment - The environment configuration to add
 * @returns the parsed environment that was added or updated or undefined if the collection is not found
 *
 * @example
 * // Add a new development environment
 * const success = addEnvironment('development', {
 *   variables: { apiUrl: 'https://dev.example.com/api' }
 * })
 *
 * if (success) {
 *   console.log('Environment added successfully')
 * } else {
 *   console.log('Environment already exists')
 * }
 */
export const upsertEnvironment = (
  collection: WorkspaceDocument | Workspace | null,
  environmentName: string,
  payload: Partial<XScalarEnvironment>,
  newName?: string,
): XScalarEnvironment | undefined => {
  if (!collection) {
    return
  }

  if (!collection['x-scalar-environments']) {
    collection['x-scalar-environments'] = {}
  }

  // Ensure we parse the payload for type safety
  const parsed = coerceValue(xScalarEnvironmentSchema, payload)
  collection['x-scalar-environments'][environmentName] = parsed

  // Rename the environment
  if (newName && newName !== environmentName) {
    console.log('renaming environment', environmentName, 'to', newName)
    collection['x-scalar-environments'][newName] = parsed
    delete collection['x-scalar-environments'][environmentName]
  }

  return parsed
}

/**
 * Removes an environment from the document or workspace's x-scalar-environments extension by its name.
 *
 * @param name - The name of the environment to remove
 *
 * @example
 * // Remove a development environment
 * deleteEnvironment('development')
 */
export const deleteEnvironment = (collection: WorkspaceDocument | Workspace | null, environmentName: string) =>
  delete collection?.['x-scalar-environments']?.[environmentName]
