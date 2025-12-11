import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import {
  type XScalarEnvironment,
  xScalarEnvironmentSchema,
} from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'

export const getActiveEnvironment = (
  workspace: WorkspaceStore | null,
  document: WorkspaceDocument | null,
): XScalarEnvironment => {
  if (workspace === null) {
    return coerceValue(xScalarEnvironmentSchema, {})
  }
  const activeEnv = workspace.workspace['x-scalar-active-environment']

  if (!activeEnv) {
    return coerceValue(xScalarEnvironmentSchema, {})
  }

  const workspaceEnv = workspace.workspace['x-scalar-environments']?.[activeEnv] ?? {
    variables: [],
  }
  const documentEnv = document?.['x-scalar-environments']?.[activeEnv] ?? {
    variables: [],
  }

  return coerceValue(xScalarEnvironmentSchema, {
    ...workspaceEnv,
    ...documentEnv,
    variables: [...workspaceEnv.variables, ...documentEnv.variables],
  })
}
