import type { VariableEntry, VariablesStore } from '@scalar/oas-utils/helpers'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { Workspace } from '@scalar/workspace-store/schemas/workspace'

function envVarsToEntries(environment: XScalarEnvironment): VariableEntry[] {
  return (environment.variables ?? []).map((v) => ({
    key: v.name,
    value: typeof v.value === 'string' ? v.value : v.value.default,
  }))
}

/** Minimal environment mutators used to sync script-set variables synchronously */
export type EnvironmentMutators = {
  upsertEnvironment: (payload: {
    environmentName: string
    payload: Partial<XScalarEnvironment>
  }) => void
  upsertEnvironmentVariable: (payload: {
    environmentName: string
    variable: { name: string; value: string }
    index?: number
  }) => void
}

/**
 * Ensures the selected environment exists on the collection by calling the
 * mutator directly (synchronous).
 */
function ensureEnvironmentExists(
  mutators: EnvironmentMutators,
  collection: WorkspaceDocument | Workspace | null,
  environmentName: string,
): void {
  if (!collection || !environmentName) {
    return
  }
  const envs = collection['x-scalar-environments']
  if (envs?.[environmentName]) {
    return
  }
  mutators.upsertEnvironment({
    environmentName,
    payload: { color: '#FFFFFF', variables: [] },
  })
}

/**
 * Syncs script-set variables into the document or workspace environment by
 * calling the mutators directly (synchronous).
 */
function syncVariablesToCollection(
  mutators: EnvironmentMutators,
  collection: WorkspaceDocument | Workspace | null,
  environmentName: string,
  entries: VariableEntry[],
): void {
  if (!collection || !environmentName || entries.length === 0) {
    return
  }
  ensureEnvironmentExists(mutators, collection, environmentName)
  const variables = collection['x-scalar-environments']?.[environmentName]?.variables ?? []

  for (const entry of entries) {
    const index = variables.findIndex((v) => v.name === entry.key)
    const variable = { name: entry.key, value: entry.value }
    mutators.upsertEnvironmentVariable({
      environmentName,
      variable,
      ...(index >= 0 ? { index } : {}),
    })
  }
}

export type CreateVariablesStoreForRequestParams = {
  /** Merged environment (workspace + document) used for script reads */
  environment: XScalarEnvironment
  /** Name of the currently selected environment */
  activeEnvironmentName: string | undefined
  /** Mutators for document environment (used by setCollectionVariables). Call mutators synchronously. */
  documentEnvironmentMutators: EnvironmentMutators
  /** Mutators for workspace environment (used by setGlobals). Call mutators synchronously. */
  workspaceEnvironmentMutators: EnvironmentMutators
  /** Active document (for setCollectionVariables → document env vars) */
  document: WorkspaceDocument | null
  /** Workspace object (for setGlobals → workspace env vars) */
  workspace: Workspace | null
}

/**
 * Creates a VariablesStore for the request lifecycle. Scripts read from the merged
 * environment; when they call setCollectionVariables or setGlobals, we sync those
 * values back to the document or workspace selected environment via the mutators
 * (synchronous). setLocalVariables is for chaining requests (runner).
 */
export function createVariablesStoreForRequest({
  environment,
  activeEnvironmentName,
  documentEnvironmentMutators,
  workspaceEnvironmentMutators,
  document,
  workspace,
}: CreateVariablesStoreForRequestParams): VariablesStore {
  const envEntries = envVarsToEntries(environment)

  const localVariables: VariableEntry[] = []

  return {
    getEnvironment: () => envEntries,
    getGlobals: () => envEntries,
    getCollectionVariables: () => envEntries,
    getData: () => ({}),
    getLocalVariables: () => {
      return localVariables
    },

    setLocalVariables: (variables) => {
      localVariables.length = 0
      localVariables.push(...variables)
    },

    setCollectionVariables: (variables) => {
      if (!activeEnvironmentName || !document) {
        return
      }
      syncVariablesToCollection(
        documentEnvironmentMutators,
        document,
        activeEnvironmentName,
        variables,
      )
    },

    setGlobals: (variables) => {
      if (!activeEnvironmentName || !workspace) {
        return
      }
      syncVariablesToCollection(
        workspaceEnvironmentMutators,
        workspace,
        activeEnvironmentName,
        variables,
      )
    },
  }
}
