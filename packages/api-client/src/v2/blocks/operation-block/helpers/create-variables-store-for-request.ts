import type { VariableEntry, VariablesStore } from '@scalar/oas-utils/helpers'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { Workspace } from '@scalar/workspace-store/schemas/workspace'

function envVarsToEntries(environment: XScalarEnvironment): VariableEntry[] {
  return (environment.variables ?? []).map((v) => ({
    key: v.name,
    value: typeof v.value === 'string' ? v.value : v.value.default,
  }))
}

/**
 * Emits environment:upsert:environment so the selected environment exists on the
 * collection (document or workspace) before we upsert variables.
 */
function ensureEnvironmentExists(
  eventBus: WorkspaceEventBus,
  collection: WorkspaceDocument | Workspace | null,
  collectionType: 'document' | 'workspace',
  environmentName: string,
): void {
  if (!collection || !environmentName) {
    return
  }
  const envs = collection['x-scalar-environments']
  if (envs?.[environmentName]) {
    return
  }
  eventBus.emit('environment:upsert:environment', {
    collectionType,
    environmentName,
    payload: { color: '#FFFFFF', variables: [] },
  })
}

/**
 * Syncs script-set variables into the document or workspace environment by emitting
 * environment:upsert:environment-variable events. Ensures the target environment
 * exists before upserting variables.
 */
function syncVariablesToCollection(
  eventBus: WorkspaceEventBus,
  collection: WorkspaceDocument | Workspace | null,
  collectionType: 'document' | 'workspace',
  environmentName: string,
  entries: VariableEntry[],
): void {
  if (!collection || !environmentName || entries.length === 0) {
    return
  }
  ensureEnvironmentExists(eventBus, collection, collectionType, environmentName)
  const variables = collection['x-scalar-environments']?.[environmentName]?.variables ?? []

  for (const entry of entries) {
    const index = variables.findIndex((v) => v.name === entry.key)
    const variable = { name: entry.key, value: entry.value }
    eventBus.emit('environment:upsert:environment-variable', {
      collectionType,
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
  /** Event bus to emit environment variable updates */
  eventBus: WorkspaceEventBus
  /** Workspace object (for setGlobals → workspace env vars) */
  workspace: Workspace | null
  /** Active document (for setCollectionVariables → document env vars) */
  document: WorkspaceDocument | null
}

/**
 * Creates a VariablesStore for the request lifecycle. Scripts read from the merged
 * environment; when they call setCollectionVariables or setGlobals, we sync those
 * values back to the document or workspace selected environment so both stores stay
 * in sync. setLocalVariables is a no-op (reserved for chaining requests).
 */
export function createVariablesStoreForRequest({
  environment,
  activeEnvironmentName,
  eventBus,
  workspace,
  document,
}: CreateVariablesStoreForRequestParams): VariablesStore {
  const envEntries = envVarsToEntries(environment)

  return {
    getEnvironment: () => envEntries,
    getGlobals: () => envEntries,
    getCollectionVariables: () => envEntries,
    getData: () => ({}),
    getLocalVariables: () => [],

    setLocalVariables: (variables) => {
      // Reserved for chaining requests; no-op for now
      console.log('setLocalVariables', variables)
    },

    setCollectionVariables: (variables) => {
      console.log('setCollectionVariables', variables)
      if (!activeEnvironmentName || !document) {
        return
      }
      syncVariablesToCollection(eventBus, document, 'document', activeEnvironmentName, variables)
    },

    setGlobals: (variables) => {
      console.log('setGlobals', variables)
      if (!activeEnvironmentName || !workspace) {
        return
      }
      syncVariablesToCollection(eventBus, workspace, 'workspace', activeEnvironmentName, variables)
    },
  }
}
