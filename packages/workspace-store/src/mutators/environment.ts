import type { EnvironmentEvents } from '@/events/definitions/environment'
import { unpackProxyObject } from '@/helpers/unpack-proxy'
import type { Workspace, WorkspaceDocument } from '@/schemas'
import {
  type XScalarEnvVar,
  type XScalarEnvironment,
  xScalarEnvVarSchema,
  xScalarEnvironmentSchema,
} from '@/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@/schemas/typebox-coerce'

type Event<T extends keyof EnvironmentEvents> = Omit<EnvironmentEvents[T], 'collectionType'>

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
  workspace: Workspace | null,
  collection: WorkspaceDocument | Workspace | null,
  { environmentName, payload, oldEnvironmentName }: Event<'environment:upsert:environment'>,
): XScalarEnvironment | undefined => {
  /** Discriminating between document and workspace */
  if (!collection || !workspace) {
    return
  }

  if (!collection['x-scalar-environments']) {
    collection['x-scalar-environments'] = {}
  }

  // Check if this is a new environment before we create it
  const isNewEnvironment = !collection['x-scalar-environments'][oldEnvironmentName ?? environmentName]

  // Ensure we parse the payload but keep the old variables
  const parsed = coerceValue(xScalarEnvironmentSchema, {
    ...unpackProxyObject(collection['x-scalar-environments'][oldEnvironmentName ?? environmentName], { depth: 1 }),
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

export const deleteEnvironment = (
  workspace: Workspace | null,
  collection: WorkspaceDocument | Workspace | null,
  { environmentName }: Event<'environment:delete:environment'>,
) => {
  if (!collection || !workspace) {
    return
  }

  delete collection['x-scalar-environments']?.[environmentName]
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
  { environmentName, variable, index }: Event<'environment:upsert:environment-variable'>,
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

export const deleteEnvironmentVariable = (
  collection: WorkspaceDocument | Workspace | null,
  { environmentName, index }: Event<'environment:delete:environment-variable'>,
) => {
  if (!collection?.['x-scalar-environments']?.[environmentName]) {
    console.error('Environment not found', environmentName)
    return
  }
  collection['x-scalar-environments']?.[environmentName]?.variables?.splice(index, 1)
}

export const environmentMutatorsFactory = ({
  workspace,
  collection,
}: {
  workspace: Workspace | null
  collection: WorkspaceDocument | Workspace | null
}) => {
  return {
    upsertEnvironment: (payload: Event<'environment:upsert:environment'>) =>
      upsertEnvironment(workspace, collection, payload),
    deleteEnvironment: (payload: Event<'environment:delete:environment'>) =>
      deleteEnvironment(workspace, collection, payload),
    upsertEnvironmentVariable: (payload: Event<'environment:upsert:environment-variable'>) =>
      upsertEnvironmentVariable(collection, payload),
    deleteEnvironmentVariable: (payload: Event<'environment:delete:environment-variable'>) =>
      deleteEnvironmentVariable(collection, payload),
  }
}
