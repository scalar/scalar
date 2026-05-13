import type { AnyEventListener, ApiReferenceEvents, WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { RequestFactory, VariablesStore } from '@scalar/workspace-store/request-example'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { Component, DefineComponent } from 'vue'

/** Shared fields present on every response body handler variant */
type ResponseBodyHandlerBase = {
  /** MIME type patterns this handler matches (exact or glob like "application/vnd.*+json") */
  mimeTypes: string[]
  /** Custom decoder: transform raw bytes into displayable data */
  decode?: (buffer: ArrayBuffer, contentType: string) => string | Blob | Promise<string | Blob>
  /** Custom component for the preview view */
  previewComponent?: Component
}

/**
 * Describes how a plugin handles a specific content type in the response body.
 *
 * The raw view is configured with either:
 * - `rawComponent`: A custom Vue component (receives `content` and `contentType` props).
 * - `language`: A CodeMirror language hint for the built-in raw renderer.
 *
 * These two options are mutually exclusive — providing `rawComponent` means the
 * built-in renderer is not used, so `language` would have no effect.
 */
export type ResponseBodyHandler = ResponseBodyHandlerBase &
  ({ rawComponent: Component; language?: never } | { rawComponent?: never; language?: string })

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
 *   },
 *   responseBody: [{
 *     mimeTypes: ['application/msgpack', 'application/x-msgpack'],
 *     decode: (buffer) => {
 *       const decoded = msgpack.decode(new Uint8Array(buffer));
 *       return JSON.stringify(decoded, null, 2);
 *     },
 *     language: 'json',
 *   }]
 * }
 */
/** Lifecycle hooks for app-level plugin concerns (analytics, logging, etc.) */
type ClientPluginLifecycle = {
  /** Called when the API client is initialized */
  onInit?: (context?: { config: Record<string, unknown> }) => void
  /** Called when the API client configuration changes */
  onConfigChange?: (context: { config: Record<string, unknown> }) => void
  /** Called when the API client is destroyed */
  onDestroy?: () => void
}

export type ClientPlugin = {
  hooks?: Partial<ClientPluginHooks>
  components?: Partial<ClientPluginComponents>
  /** Lifecycle hooks for app-level concerns */
  lifecycle?: ClientPluginLifecycle
  /**
   * Subscribe to every event on the bus. The framework wires this up to
   * `bus.onAny` and handles subscribe/unsubscribe automatically.
   *
   * The listener receives a single tagged-union argument `{ event, payload }`
   * where `event` is the discriminant. Narrowing on `event` automatically
   * narrows `payload` to the exact type for that event — no casts, no `as`
   * assertions, and no manual runtime type checks just to satisfy the
   * compiler. Destructuring in the parameter list works too.
   *
   * @example
   * on: ({ event, payload }) => {
   *   if (event === 'log:user-login') {
   *     // payload is narrowed to { uid: string; email?: string; teamUid: string }
   *     posthog.identify(payload.uid, { email: payload.email })
   *   }
   *
   *   if (event === 'operation:create:operation') {
   *     // payload is narrowed to the operation-create payload
   *     analytics.track('operation_created', payload)
   *   }
   * }
   */
  on?: AnyEventListener
  /** Custom response body handlers for specific content types */
  responseBody?: ResponseBodyHandler[]
}

/**
 * Subscribes a single plugin's `on` listener to the given event bus via `onAny`.
 *
 * The plugin's `on` is passed straight through to `bus.onAny`, so it will
 * receive every event emitted on the bus as a `{ event, payload }` object.
 * Plugins without an `on` listener get a no-op unsubscribe.
 *
 * Returns an unsubscribe function. Call it when the plugin is torn down or
 * the bus is destroyed to remove the wildcard listener.
 *
 * @example
 * const unsubscribe = subscribePluginEvents(eventBus, plugin)
 * // later...
 * unsubscribe()
 */
export const subscribePluginEvents = (eventBus: WorkspaceEventBus, plugin: ClientPlugin): (() => void) => {
  if (!plugin.on) {
    return () => {
      // no-op
    }
  }

  return eventBus.onAny(plugin.on)
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
