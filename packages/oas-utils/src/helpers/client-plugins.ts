import type { ApiReferenceEvents } from '@scalar/workspace-store/events'
import type { RequestFactory, VariablesStore } from '@scalar/workspace-store/request-example'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { DefineComponent } from 'vue'

/** A type representing the hooks that a client plugin can define */
type ClientPluginHooks = {
  beforeRequest: (payload: {
    /** Workspace-store request spec; mutable by pre-request scripts (headers, method). */
    requestBuilder: RequestFactory
    document: OpenApiDocument
    operation: OperationObject
    variablesStore?: VariablesStore
  }) => void | Promise<void>
  responseReceived: (payload: {
    response: Response
    /** Request builder object that was used to build the request. Mutating this object will not affect the request object. */
    requestBuilder: RequestFactory
    /** Request object that was sent to the server. */
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
 *     beforeRequest: ({ request }) => {
 *       request.headers.set('X-Custom-Header', 'foo');
 *       return { request };
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
/** Lifecycle hooks for app-level plugin concerns (analytics, logging, etc.) */
type ClientPluginLifecycle = {
  /** Called when the API client is initialized */
  onInit?: () => void
  /** Called when the API client is destroyed */
  onDestroy?: () => void
}

export type ClientPlugin = {
  hooks?: Partial<ClientPluginHooks>
  components?: Partial<ClientPluginComponents>
  /** Lifecycle hooks for app-level concerns */
  lifecycle?: ClientPluginLifecycle
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
