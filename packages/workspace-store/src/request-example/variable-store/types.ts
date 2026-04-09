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
   * Optional. Called after script execution with environment variables set by the script
   * (pm.environment.set). If implemented, the host can persist or merge these
   * for the next request.
   */
  setEnvironment?(variables: VariableEntry[]): void
  /**
   * Optional. Called after script execution with globals set by the script
   * (pm.globals.set). If implemented, the host can persist or merge these
   * for the next request.
   */
  setGlobals?(variables: VariableEntry[]): void
  /** Merged variables from all scopes based on the different leyers. */
  getVariables(): Record<string, string>
}
