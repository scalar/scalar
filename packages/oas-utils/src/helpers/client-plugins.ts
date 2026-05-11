import type { ApiReferenceEvents, EventGlob, GlobListener, WorkspaceEventBus } from '@scalar/workspace-store/events'
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
   * Subscribe to event bus events. The framework handles subscribe/unsubscribe automatically.
   *
   * Supports the same glob patterns as `bus.onGlob`:
   * - An exact event key fires only for that event.
   * - `'*'` fires for every event on the bus.
   * - `'operation:*'` fires for every event whose name starts with `'operation:'`.
   *
   * Glob listeners receive both the concrete event name and its payload.
   * Exact-key listeners receive only the payload.
   *
   * @example
   * // Listen to a specific event
   * on: { 'operation:create:operation': (payload) => track(payload) }
   *
   * // Listen to all operation events
   * on: { 'operation:*': (event, payload) => log(event, payload) }
   *
   * // Listen to every event
   * on: { '*': (event, payload) => log(event, payload) }
   */
  on?: Partial<
    { [K in keyof ApiReferenceEvents]: (payload: ApiReferenceEvents[K]) => void } & {
      [G in EventGlob]: GlobListener<G>
    }
  >
  /** Custom response body handlers for specific content types */
  responseBody?: ResponseBodyHandler[]
}

/**
 * Subscribes a single plugin's `on` event handlers to the given event bus.
 *
 * - Exact-key handlers (e.g. `'log:user-login'`) are dispatched via a single
 *   `onGlob('*')` listener that looks up the handler by event name. This avoids
 *   creating N individual bus subscriptions.
 * - Glob handlers (e.g. `'*'`, `'operation:*'`) are registered directly with
 *   `onGlob` so they receive both the event name and payload as a discriminated union.
 *
 * Returns an unsubscribe function that removes all subscriptions added for this
 * plugin. Call it when the plugin is torn down or the bus is destroyed.
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

  const on = plugin.on
  const unsubscribes: (() => void)[] = []

  const keys = Object.keys(on)
  const hasExactKeyHandlers = keys.some((key) => !key.includes('*'))

  // Exact-key handlers — a single glob listener dispatches to the correct
  // handler by looking up the event name, avoiding N individual subscriptions.
  // Only registered when the plugin defines at least one non-glob handler key.
  if (hasExactKeyHandlers) {
    unsubscribes.push(
      eventBus.onGlob('*', (event: keyof ApiReferenceEvents, payload: ApiReferenceEvents[keyof ApiReferenceEvents]) => {
        const handler = on[event] as ((payload: ApiReferenceEvents[keyof ApiReferenceEvents]) => void) | undefined
        handler?.(payload)
      }),
    )
  }

  // Glob handlers ('*', 'prefix:*') get their own onGlob subscription so they
  // receive both the event name and payload as a discriminated union
  for (const key of keys) {
    if (key === '*' || key.endsWith(':*')) {
      const pattern = key as EventGlob
      const handler = on[pattern] as GlobListener<typeof pattern>
      unsubscribes.push(eventBus.onGlob(pattern, handler))
    }
  }

  return () => {
    for (const unsubscribe of unsubscribes) {
      unsubscribe()
    }
  }
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
