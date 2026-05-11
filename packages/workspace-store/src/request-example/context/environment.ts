import type { WorkspaceStore } from '@/client'
import { type XScalarEnvironment, xScalarEnvironmentSchema } from '@/schemas/extensions/document/x-scalar-environments'
import { isOpenApiDocument } from '@/schemas/type-guards'
import { coerceValue } from '@/schemas/typebox-coerce'
import type { WorkspaceDocument } from '@/schemas/workspace'

/**
 * Returns the active environment context for a given workspace and document.
 *
 * - If there is no workspace, returns a default (empty) environment.
 * - If no environment is selected (no active environment), returns a default environment.
 * - Otherwise, combines variables from both the workspace and document environments,
 *   merging document environment values over workspace ones. The variables arrays from both
 *   sources are concatenated and passed through the environment schema.
 *
 * @param workspace Workspace store instance or null if unavailable
 * @param document Document data or null if unavailable
 * @returns An object with the environment name (or null) and a validated XScalarEnvironment
 */
export const getActiveEnvironment = (
  workspace: WorkspaceStore | null,
  document: WorkspaceDocument | null,
): {
  name: string | null
  environment: XScalarEnvironment
} => {
  // If workspace is null, return default (empty) environment
  if (workspace === null) {
    return {
      name: null,
      environment: coerceValue(xScalarEnvironmentSchema, {}),
    }
  }
  // Get the name of the currently active environment from workspace
  const activeEnv = workspace.workspace['x-scalar-active-environment']

  // If no active environment is set, return default (empty) environment
  if (!activeEnv) {
    return {
      name: null,
      environment: coerceValue(xScalarEnvironmentSchema, {}),
    }
  }

  // Get environment variables from workspace and document (if present)
  const workspaceEnv = workspace.workspace['x-scalar-environments']?.[activeEnv] ?? {
    variables: [],
  }
  const documentEnv = (isOpenApiDocument(document) ? document['x-scalar-environments']?.[activeEnv] : undefined) ?? {
    variables: [],
  }

  // Merge workspace and document variables, with document variables appended
  return {
    name: activeEnv,
    environment: coerceValue(xScalarEnvironmentSchema, {
      ...workspaceEnv,
      ...documentEnv,
      variables: [...workspaceEnv.variables, ...documentEnv.variables],
    }),
  }
}
