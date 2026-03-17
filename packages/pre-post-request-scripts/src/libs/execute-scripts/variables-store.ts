/**
 * External store for pm.variables used by post-response (and pre-request) scripts.
 *
 * Mirrors the Postman variable precedence: local (in-memory) overrides data, then
 * environment, then collection, then globals. Scripts can read all scopes via
 * pm.variables.get() and only write to the local scope via pm.variables.set();
 * after execution, the adapter writes local variables back through setLocalVariables.
 *
 * @see https://github.com/postmanlabs/postman-sandbox test/unit/pm-variables.test.js
 */

export type VariableEntry = { key: string; value: string }

/**
 * Store interface for workspace/env and in-memory local variables used by the
 * Postman sandbox. The host (e.g. api-client) can implement this to provide
 * environment/globals/collection variables and to persist local variables
 * set by scripts (pm.variables.set), collection variables (pm.collectionVariables.set),
 * and globals (pm.globals.set).
 */
export type VariablesStore = {
  /** Workspace / environment variables (read-only in scripts). */
  getEnvironment(): VariableEntry[] | Record<string, string>
  /** Global variables; scripts can set via pm.globals.set. */
  getGlobals(): VariableEntry[] | Record<string, string>
  /** Collection-level variables; scripts can set via pm.collectionVariables.set. */
  getCollectionVariables(): VariableEntry[] | Record<string, string>
  /** Request/iteration data (read-only in scripts). */
  getData(): Record<string, string>
  /** In-memory local variables; scripts can set these via pm.variables.set. */
  getLocalVariables(): VariableEntry[] | Record<string, string>
  /**
   * Called after script execution with the updated local variables so the host
   * can persist them for the next request or display.
   */
  setLocalVariables(variables: VariableEntry[]): void
  /**
   * Optional. Called after script execution with collection variables set by
   * the script (pm.collectionVariables.set). If implemented, the host can
   * persist or merge these for the next request.
   */
  setCollectionVariables?(variables: VariableEntry[]): void
  /**
   * Optional. Called after script execution with globals set by the script
   * (pm.globals.set). If implemented, the host can persist or merge these
   * for the next request.
   */
  setGlobals?(variables: VariableEntry[]): void
}

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
