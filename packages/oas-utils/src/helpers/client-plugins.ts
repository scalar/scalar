import type { ApiReferenceEvents } from '@scalar/workspace-store/events'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { DefineComponent } from 'vue'

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

/** A type representing the hooks that a client plugin can define */
type ClientPluginHooks = {
  beforeRequest: (payload: {
    request: Request
    document: OpenApiDocument
    operation: OperationObject
    variablesStore?: VariablesStore
  }) => { request: Request } | void | Promise<{ request: Request } | void>
  responseReceived: (payload: {
    response: Response
    request: Request
    document: OpenApiDocument
    operation: OperationObject
    variablesStore?: VariablesStore
  }) => void | Promise<void>
}

/** A vue component which accepts the specified props */
type ClientPluginComponent<
  Props extends Record<string, unknown>,
  Emits extends Record<string, (...args: any[]) => void> = {},
> = {
  component: DefineComponent<Props, {}, {}, {}, {}, {}, {}, Emits>
  additionalProps?: Record<string, unknown>
}

type ClientPluginComponents = {
  request: ClientPluginComponent<
    {
      operation?: OperationObject
      // We could pre-build the js request and pass it here in the future if needed
      // request: Request
    },
    {
      'operation:update:extension': (payload: ApiReferenceEvents['operation:update:extension']['payload']) => void
    }
  >
  response: ClientPluginComponent<{
    // response: Response
    // request: Request
    operation?: OperationObject
  }>
}

/**
 * ClientPlugin is used to extend the API Client with custom hooks and UI components.
 *
 * Example usage:
 *
 * const myPlugin: ClientPlugin = {
 *   hooks: {
 *     beforeRequest: (request) => {
 *       // Modify the request before it is sent
 *       request.headers.set('X-Custom-Header', 'foo');
 *       return request;
 *     },
 *     responseReceived: async (response, operation) => {
 *       // Handle post-response logic
 *       const data = await response.json();
 *       console.log('Received:', data, 'for operation:', operation.operationId);
 *     }
 *   },
 *   components: {
 *     request: MyRequestComponent, // Custom Vue component for rendering the request section
 *     response: MyResponseComponent // Custom Vue component for rendering the response section
 *   }
 * }
 */
export type ClientPlugin = {
  hooks?: Partial<ClientPluginHooks>
  components?: Partial<ClientPluginComponents>
}

/**
 * Maps hook names to their expected payload types.
 * This ensures type safety when executing hooks with their corresponding payloads.
 * Derived from the ClientPlugin hooks definition.
 */
type HookPayloadMap = {
  [K in keyof ClientPluginHooks]: Parameters<ClientPluginHooks[K]>[0]
}

/**
 * Execute any hook with type-safe payload handling.
 * The payload type is inferred from the hook name to ensure correct usage.
 */
export const executeHook = async <K extends keyof HookPayloadMap>(
  payload: HookPayloadMap[K],
  hookName: K,
  plugins: ClientPlugin[],
): Promise<HookPayloadMap[K]> => {
  let currentPayload = payload

  for (const plugin of plugins) {
    const hook = plugin.hooks?.[hookName]
    if (hook) {
      const modifiedPayload = await hook(currentPayload as any)
      currentPayload = (modifiedPayload ?? currentPayload) as HookPayloadMap[K]
    }
  }

  return currentPayload
}
