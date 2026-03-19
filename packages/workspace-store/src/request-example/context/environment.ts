import type { WorkspaceStore } from '@/client'
import { type XScalarEnvironment, xScalarEnvironmentSchema } from '@/schemas/extensions/document/x-scalar-environments'
import { coerceValue } from '@/schemas/typebox-coerce'
import type { WorkspaceDocument } from '@/schemas/workspace'

export const getActiveEnvironment = (
  workspace: WorkspaceStore | null,
  document: WorkspaceDocument | null,
): {
  name: string | null
  environment: XScalarEnvironment
} => {
  if (workspace === null) {
    return {
      name: null,
      environment: coerceValue(xScalarEnvironmentSchema, {}),
    }
  }
  const activeEnv = workspace.workspace['x-scalar-active-environment']

  if (!activeEnv) {
    return {
      name: null,
      environment: coerceValue(xScalarEnvironmentSchema, {}),
    }
  }

  const workspaceEnv = workspace.workspace['x-scalar-environments']?.[activeEnv] ?? {
    variables: [],
  }
  const documentEnv = document?.['x-scalar-environments']?.[activeEnv] ?? {
    variables: [],
  }

  return {
    name: activeEnv,
    environment: coerceValue(xScalarEnvironmentSchema, {
      ...workspaceEnv,
      ...documentEnv,
      variables: [...workspaceEnv.variables, ...documentEnv.variables],
    }),
  }
}
