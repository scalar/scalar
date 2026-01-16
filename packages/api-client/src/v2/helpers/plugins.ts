import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { Component } from 'vue'

/** A type representing the hooks that a client plugin can define */
type ClientPluginHooks = {
  beforeRequest: (payload: { request: Request }) => { request: Request } | Promise<{ request: Request }>
  responseReceived: (payload: {
    response: Response
    request: Request
    operation: OperationObject
  }) => void | Promise<void>
}

/** A type representing the components that a client plugin can define */
type ClientPluginComponents = {
  request: Component
  response: Component
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
