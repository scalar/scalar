import type { EnvironmentEvents } from '@/events/definitions/environment'
import type { Workspace, WorkspaceDocument } from '@/schemas'
import {
  type XScalarEnvVar,
  type XScalarEnvironment,
  xScalarEnvVarSchema,
  xScalarEnvironmentSchema,
} from '@/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@/schemas/typebox-coerce'

/**
 * Adds OR updates an environment to the document or workspace.
 *
 * @param document - current document if available
 * @param workspace - current workspace if available
 * @param environmentName - Name of the environment to add
 * @param payload - The environment configuration to add
 * @param oldEnvironmentName - Only needed when renaming the environment
 * @returns the parsed environment that was added or updated or undefined if the collection is not found
 */
export const upsertEnvironment = (
  document: WorkspaceDocument | null,
  workspace: Workspace,
  { environmentName, payload, collectionType, oldEnvironmentName }: EnvironmentEvents['environment:upsert:environment'],
): XScalarEnvironment | undefined => {
  /** Discriminating between document and workspace */
  const collection = collectionType === 'document' ? document : workspace
  if (!collection) {
    return
  }

  if (!collection['x-scalar-environments']) {
    collection['x-scalar-environments'] = {}
  }

  // Check if this is a new environment before we create it
  const isNewEnvironment = !collection['x-scalar-environments'][oldEnvironmentName ?? environmentName]

  // Ensure we parse the payload but keep the old variables
  const parsed = coerceValue(xScalarEnvironmentSchema, {
    ...collection['x-scalar-environments'][oldEnvironmentName ?? environmentName],
    ...payload,
  })
  collection['x-scalar-environments'][environmentName] = parsed

  // If we are renaming the environment, we need to delete the old one
  if (oldEnvironmentName && oldEnvironmentName !== environmentName) {
    delete collection['x-scalar-environments'][oldEnvironmentName]

    // If the old environment was active, we need to set the new environment as active
    if (workspace['x-scalar-active-environment'] === oldEnvironmentName) {
      workspace['x-scalar-active-environment'] = environmentName
    }
  }

  // Set the newly created workspace environment as active
  if (isNewEnvironment) {
    workspace['x-scalar-active-environment'] = environmentName
  }

  return parsed
}

/**
 * Adds OR updates an environment variable to the document or workspace.
 *
 * @param collection - Workspace OR document
 * @param environmentName - Name of the environment to add the variable to
 * @param variableName - Name of the variable to add
 * @param value - Value of the variable to add
 * @returns the parsed variable that was added or updated or undefined if the collection is not found
 */
export const upsertEnvironmentVariable = (
  collection: WorkspaceDocument | Workspace | null,
  { environmentName, variable, index }: EnvironmentEvents['environment:upsert:environment-variable'],
): XScalarEnvVar | undefined => {
  // The environment should exist by now if we are upserting a variable
  if (!collection?.['x-scalar-environments']?.[environmentName]) {
    console.error('Environment not found', environmentName)
    return
  }

  // Ensure we parse the variable for type safety
  const parsed = coerceValue(xScalarEnvVarSchema, variable)

  if (index !== undefined) {
    // Delete the row if the name is empty
    if (parsed.name === '') {
      collection['x-scalar-environments'][environmentName].variables.splice(index, 1)
      return
    }

    // Update
    collection['x-scalar-environments'][environmentName].variables[index] = parsed
  }
  // Add
  else {
    collection['x-scalar-environments'][environmentName].variables.push(parsed)
  }

  return parsed
}
