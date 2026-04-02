import type { VariableEntry, VariablesStore } from '@scalar/workspace-store/request-example'

function toKeyValueArray(input: VariableEntry[] | Record<string, string>): VariableEntry[] {
  if (Array.isArray(input)) {
    return input
  }
  return Object.entries(input).map(([key, value]) => ({ key, value }))
}

/**
 * Converts a VariablesStore into key-value arrays per scope for building
 * the Postman sandbox context (e.g. with postman-collection VariableScope).
 */
export function getVariableScopesFromStore(store: VariablesStore): {
  environment: VariableEntry[]
  globals: VariableEntry[]
  collectionVariables: VariableEntry[]
  data: Record<string, string>
  local: VariableEntry[]
} {
  return {
    environment: toKeyValueArray(store.getEnvironment()),
    globals: toKeyValueArray(store.getGlobals()),
    collectionVariables: toKeyValueArray(store.getCollectionVariables()),
    data: store.getData(),
    local: toKeyValueArray(store.getLocalVariables()),
  }
}

/**
 * Parses the sandbox execution result’s _variables (array of { key, value, type })
 * into a key-value record and calls store.setLocalVariables.
 */
const toVariableEntries = (
  values: Array<{ key: string; value: string; type?: string }> | undefined,
): VariableEntry[] => {
  if (!values?.length) {
    return []
  }
  return values.map((v) => ({ key: v.key, value: v.value }))
}

export function applyExecutionLocalVariables(
  store: VariablesStore,
  values: Array<{ key: string; value: string; type?: string }> | undefined,
): void {
  const entries = toVariableEntries(values)
  if (entries.length === 0) {
    return
  }
  store.setLocalVariables(entries)
}

/**
 * Parses the sandbox execution result's collectionVariables and calls
 * store.setCollectionVariables when the store implements it.
 */
export function applyExecutionCollectionVariables(
  store: VariablesStore,
  values: Array<{ key: string; value: string; type?: string }> | undefined,
): void {
  const entries = toVariableEntries(values)
  if (entries.length === 0 || !store.setCollectionVariables) {
    return
  }
  store.setCollectionVariables(entries)
}

/**
 * Parses the sandbox execution result's globals and calls store.setGlobals
 * when the store implements it.
 */
export function applyExecutionGlobals(
  store: VariablesStore,
  values: Array<{ key: string; value: string; type?: string }> | undefined,
): void {
  const entries = toVariableEntries(values)
  if (entries.length === 0 || !store.setGlobals) {
    return
  }
  store.setGlobals(entries)
}
