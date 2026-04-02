import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { Workspace } from '@scalar/workspace-store/schemas/workspace'

import type { WorkspaceStore } from '@/client'
import { generateClientMutators } from '@/mutators'
import type { environmentMutatorsFactory } from '@/mutators/environment'
import type { VariableEntry, VariablesStore } from '@/request-example/variable-store/types'
import type { WorkspaceDocument } from '@/schemas'

type EnvironmentMutators = ReturnType<typeof environmentMutatorsFactory>

function envVarsToEntries(environment: XScalarEnvironment | undefined): VariableEntry[] {
  if (!environment) {
    return []
  }
  return Object.values(environment.variables).map((v) => ({
    key: v.name,
    value: typeof v.value === 'string' ? v.value : v.value.default,
  }))
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
  if (!collection || !environmentName) {
    return
  }
  ensureEnvironmentExists(mutators, collection, environmentName)

  console.log('syncing variables to collection', environmentName, entries)

  mutators.upsertEnvironment({
    environmentName,
    payload: {
      variables: entries.map((entry) => ({
        name: entry.key,
        value: entry.value,
      })),
    },
  })
}

export type CreateVariablesStoreForRequestParams = {
  /** Workspace environment (for getGlobals → workspace env vars) */
  workspaceEnvironment: Record<string, XScalarEnvironment> | undefined
  /** Collection environment (for getCollectionVariables → collection env vars + environment) */
  collectionEnvironment: Record<string, XScalarEnvironment> | undefined
  /** Name of the currently selected environment */
  activeEnvironmentName: string | undefined
  /** Active document (for setCollectionVariables → document env vars) */
  document: WorkspaceDocument | null
  /** Workspace object (for setGlobals → workspace env vars) */
  workspace: WorkspaceStore | null
}

/**
 * Creates a VariablesStore for the request lifecycle. Scripts read from the merged
 * environment; when they call setCollectionVariables or setGlobals, we sync those
 * values back to the document or workspace selected environment via the mutators
 * (synchronous). setLocalVariables is for chaining requests (runner).
 */
export function createVariablesStoreForRequest({
  workspaceEnvironment,
  collectionEnvironment,
  activeEnvironmentName,
  document,
  workspace,
}: CreateVariablesStoreForRequestParams): VariablesStore {
  const mutators = generateClientMutators(workspace)

  const documentEnvironmentMutators = mutators.active().environment
  const workspaceEnvironmentMutators = mutators.workspace().environment

  const worksapceEntries = envVarsToEntries(workspaceEnvironment?.[activeEnvironmentName ?? ''])
  const collectionEntries = envVarsToEntries(collectionEnvironment?.[activeEnvironmentName ?? ''])

  const localVariables: VariableEntry[] = []

  return {
    getEnvironment: () => collectionEntries,
    getGlobals: () => worksapceEntries,
    getCollectionVariables: () => collectionEntries,
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
      syncVariablesToCollection(documentEnvironmentMutators, document, activeEnvironmentName, variables)
      collectionEntries.length = 0
      collectionEntries.push(...envVarsToEntries(collectionEnvironment?.[activeEnvironmentName ?? '']))
    },

    setGlobals: (variables) => {
      if (!activeEnvironmentName || !workspace) {
        return
      }
      syncVariablesToCollection(workspaceEnvironmentMutators, workspace.workspace, activeEnvironmentName, variables)
      worksapceEntries.length = 0
      worksapceEntries.push(...envVarsToEntries(workspaceEnvironment?.[activeEnvironmentName ?? '']))
      console.log('workspace entries', worksapceEntries)
    },
  }
}
