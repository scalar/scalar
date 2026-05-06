import { debounce } from '@scalar/helpers/general/debounce'

import { unpackProxyObject } from '@/helpers/unpack-proxy'

import type { ApiReferenceEvents } from './definitions'

type Unsubscribe = () => void

/**
 * A glob pattern for subscribing to multiple events at once.
 *
 * - `'*'` matches every event.
 * - A pattern ending with `':*'` (e.g. `'operation:*'`) matches every event
 *   whose name starts with that prefix (e.g. `'operation:send:request:hotkey'`).
 *
 * @example
 * bus.onAny('*', (event, payload) => console.log(event, payload))
 * bus.onAny('operation:*', (event, payload) => console.log(event, payload))
 */
export type EventGlob = '*' | `${string}:*`

/**
 * A single branch of the WildcardListener discriminated union for one event key.
 * Kept separate so it can be referenced by the union below.
 */
type WildcardListenerBranch<E extends keyof ApiReferenceEvents> = (event: E, payload: ApiReferenceEvents[E]) => void

/**
 * Listener type for wildcard / glob subscriptions.
 *
 * Expressed as a discriminated union over every event key so that narrowing
 * on `event` inside the listener body also narrows `payload` to its exact type.
 *
 * @example
 * bus.onGlob('*', (event, payload) => {
 *   if (event === 'log:user-login') {
 *     // payload is now { uid: string; email?: string; teamUid: string }
 *     posthog.identify(payload.uid)
 *   }
 * })
 */
export type WildcardListener = {
  [E in keyof ApiReferenceEvents]: WildcardListenerBranch<E>
}[keyof ApiReferenceEvents]

/**
 * Narrows a WildcardListener to only the events matched by a specific glob pattern.
 *
 * - `'*'` matches every event (equivalent to WildcardListener).
 * - `'prefix:*'` matches only events whose key starts with `'prefix:'`.
 *
 * This gives full type safety when writing glob handlers in ClientPlugin.on:
 * the `event` parameter is narrowed to matching keys, and `payload` is narrowed
 * to the corresponding payload type via the discriminated union.
 *
 * @example
 * on: {
 *   'operation:*': (event, payload) => {
 *     // event is narrowed to 'operation:create:operation' | 'operation:delete:operation' | ...
 *     // payload is narrowed based on event
 *   }
 * }
 */
export type GlobListener<G extends EventGlob> = G extends '*'
  ? WildcardListener
  : G extends `${infer Prefix}:*`
    ? {
        [E in keyof ApiReferenceEvents as E extends `${Prefix}:${string}` ? E : never]: WildcardListenerBranch<E>
      }[keyof {
        [E in keyof ApiReferenceEvents as E extends `${Prefix}:${string}` ? E : never]: WildcardListenerBranch<E>
      }]
    : never

/**
 * Helper type for event listeners that makes the payload optional
 * if the event allows undefined, otherwise requires it.
 */
type EventListener<E extends keyof ApiReferenceEvents> = undefined extends ApiReferenceEvents[E]
  ? (payload?: ApiReferenceEvents[E]) => void
  : (payload: ApiReferenceEvents[E]) => void

/**
 * Helper type for emit parameters that uses rest parameters
 * for a cleaner API surface.
 *
 * @example
 * bus.emit('scalar-update-sidebar', { value: true }, { debounceKey: 'test' })
 */
type EmitParameters<E extends keyof ApiReferenceEvents> = undefined extends ApiReferenceEvents[E]
  ? [event: E, payload?: ApiReferenceEvents[E], options?: { skipUnpackProxy?: boolean; debounceKey?: string }]
  : [event: E, payload: ApiReferenceEvents[E], options?: { skipUnpackProxy?: boolean; debounceKey?: string }]

/**
 * Type-safe event bus for workspace events
 *
 * - Full type safety for event names and payloads
 * - Debug mode for development
 * - Glob pattern subscriptions via `onAny` / `offAny`
 */
export type WorkspaceEventBus = {
  /**
   * Subscribe to an event
   *
   * @param event - The event name to listen for
   * @param listener - Callback function that receives the event detail
   * @returns Unsubscribe function to remove the listener
   *
   * @example
   * const unsubscribe = bus.on('scalar-update-sidebar', (detail) => {
   *   console.log('Sidebar state:', detail.value)
   * })
   *
   * // Later, clean up
   * unsubscribe()
   */
  on<E extends keyof ApiReferenceEvents>(event: E, listener: EventListener<E>): Unsubscribe

  /**
   * Remove a specific event listener
   *
   * @param event - The event name
   * @param listener - The listener function to remove
   *
   * @example
   * const handler = (detail) => console.log(detail)
   * bus.on('scalar-update-sidebar', handler)
   * bus.off('scalar-update-sidebar', handler)
   */
  off<E extends keyof ApiReferenceEvents>(event: E, listener: EventListener<E>): void

  /**
   * Subscribe to an event, but only trigger the listener once.
   * The listener is automatically removed after the first invocation.
   *
   * @param event - The event name to listen for
   * @param listener - Callback function that receives the event detail
   * @returns Unsubscribe function to remove the listener before it fires
   *
   * @example
   * bus.once('scalar-update-sidebar', (detail) => {
   *   console.log('Fired once:', detail.value)
   * })
   */
  once<E extends keyof ApiReferenceEvents>(event: E, listener: EventListener<E>): Unsubscribe

  /**
   * Subscribe to all events matching a glob pattern.
   *
   * - `'*'` fires for every event on the bus.
   * - `'operation:*'` fires for every event whose name starts with `'operation:'`.
   *
   * The listener receives the concrete event name and its payload.
   *
   * @param pattern - The glob pattern to match against event names
   * @param listener - Callback that receives the event name and payload
   * @returns Unsubscribe function to remove the listener
   *
   * @example
   * // Listen to every event
   * const off = bus.onGlob('*', (event, payload) => {
   *   analytics.track(event, payload)
   * })
   *
   * // Listen to all operation events
   * const off = bus.onGlob('operation:*', (event, payload) => {
   *   console.log('operation event:', event)
   * })
   *
   * // Clean up
   * off()
   */
  onGlob(pattern: EventGlob, listener: WildcardListener): Unsubscribe

  /**
   * Remove a glob listener added via `onGlob`.
   *
   * @param pattern - The glob pattern the listener was registered with
   * @param listener - The listener function to remove
   *
   * @example
   * const handler = (event, payload) => console.log(event, payload)
   * bus.onGlob('operation:*', handler)
   * bus.offGlob('operation:*', handler)
   */
  offGlob(pattern: EventGlob, listener: WildcardListener): void

  /**
   * Emit an event with its payload
   *
   * @param event - The event name to emit
   * @param payload - The event detail payload (optional if event allows undefined)
   * @param options.skipUnpackProxy - Whether to skip unpacking the proxy object,
   * useful if we are sure there is no proxy OR when passing js events like keyboard events.
   * @param options.debounceKey - If present we will debounce the event by the key + event name.
   *
   * @example
   * bus.emit('scalar-update-sidebar', { value: true })
   */
  emit<E extends keyof ApiReferenceEvents>(...args: EmitParameters<E>): void

  /**
   * Flush all queued debounced emits immediately.
   */
  flushDebouncedEmits?(): void
}

/**
 * Options for creating an event bus
 */
type EventBusOptions = {
  /**
   * Enable debug mode to log all events and listener operations
   * Useful for development and troubleshooting
   */
  debug?: boolean
}

/**
 * Creates a type-safe event bus for workspace events
 *
 * This implementation uses a Map for O(1) lookups and maintains
 * a separate Set for each event type to efficiently manage listeners.
 *
 * Create this once per application instance.
 *
 * @param options - Configuration options
 * @returns A fully type-safe event bus instance
 *
 * @example
 * const bus = createWorkspaceEventBus()
 *
 * // Subscribe to events
 * const unsubscribe = bus.on('scalar-update-sidebar', (detail) => {
 *   console.log('Sidebar:', detail.value)
 * })
 *
 * // Emit events
 * bus.emit('scalar-update-sidebar', { value: true })
 *
 * // Clean up
 * unsubscribe()
 */
export const createWorkspaceEventBus = (options: EventBusOptions = {}): WorkspaceEventBus => {
  const { debug = false } = options

  /**
   * Map of event names to their listener sets
   * Using Map for O(1) lookups and Set for O(1) add/remove operations
   */
  type ListenerSet = Set<EventListener<keyof ApiReferenceEvents>>
  const events = new Map<keyof ApiReferenceEvents, ListenerSet>()

  /**
   * Map of glob patterns to their wildcard listener sets.
   * Each key is an EventGlob string; the value is the set of listeners registered
   * for that pattern. Using a Map here keeps per-pattern add/remove O(1) while
   * emitting stays O(number of registered patterns) — typically a very small number.
   */
  type WildcardListenerSet = Set<WildcardListener>
  const wildcardListeners = new Map<EventGlob, WildcardListenerSet>()

  /**
   * Track pending log entries for batching
   */
  type PendingLogEntry = { message: string; args: unknown[] }
  const pendingLogs: PendingLogEntry[] = []
  let logTimeout: ReturnType<typeof setTimeout> | null = null

  /**
   * Single debounce instance for all debounced emits
   * Uses keys to separate different event + debounceKey combinations
   */
  const { execute: debouncedEmitter, flushAll: flushDebouncedEmitters } = debounce({
    delay: 328,
  })

  /**
   * Get or create a listener set for an event
   */
  const getListeners = <E extends keyof ApiReferenceEvents>(event: E): ListenerSet => {
    const listeners = events.get(event) ?? new Set()
    events.set(event, listeners)
    return listeners
  }

  /**
   * Get or create a wildcard listener set for a glob pattern
   */
  const getWildcardListeners = (pattern: EventGlob): WildcardListenerSet => {
    const listeners = wildcardListeners.get(pattern) ?? new Set()
    wildcardListeners.set(pattern, listeners)
    return listeners
  }

  /**
   * Check whether a given event name matches a glob pattern.
   * - `'*'` matches everything.
   * - `'prefix:*'` matches any event that starts with `'prefix:'`.
   *
   * This is kept intentionally simple — no full glob syntax — so the hot-path
   * check is a single string comparison with no allocations.
   */
  const matchesGlob = (pattern: EventGlob, event: keyof ApiReferenceEvents): boolean => {
    if (pattern === '*') {
      return true
    }
    // Pattern is guaranteed to end with ':*' by the EventGlob type
    const prefix = pattern.slice(0, -1) // strip the trailing '*'
    return (event as string).startsWith(prefix)
  }

  /**
   * Flush batched logs using console.groupCollapsed
   */
  const flushLogs = (): void => {
    if (pendingLogs.length === 0) {
      return
    }

    if (debug) {
      if (pendingLogs.length === 1) {
        // Only one log, output it normally without grouping
        const firstLog = pendingLogs[0]
        if (firstLog) {
          console.log(`[EventBus] ${firstLog.message}`, ...firstLog.args)
        }
      } else {
        // Multiple logs: use a single collapsed group with one console.table call.
        // Calling console.log N times (e.g. 105x) inside a setTimeout is expensive
        // and triggers a [Violation] 'setTimeout' handler warning in Chrome DevTools.
        console.groupCollapsed(`[EventBus] ${pendingLogs.length} operations`)
        console.table(pendingLogs.map(({ message, args }) => ({ event: message, payload: args[0] ?? '' })))
        console.groupEnd()
      }
    }

    pendingLogs.length = 0
    logTimeout = null
  }

  /**
   * Log debug information if debug mode is enabled
   * Batches multiple logs together using console.groupCollapsed
   */
  const log = (message: string, ...args: unknown[]): void => {
    if (debug) {
      pendingLogs.push({ message, args })

      // Clear existing timeout and set a new one to batch logs
      if (logTimeout) {
        clearTimeout(logTimeout)
      }
      logTimeout = setTimeout(flushLogs, 500)
    }
  }

  const once = <E extends keyof ApiReferenceEvents>(event: E, listener: EventListener<E>): Unsubscribe => {
    const wrapper = (payload: ApiReferenceEvents[E] | undefined): void => {
      off(event, wrapper as EventListener<E>)
      ;(listener as (payload: ApiReferenceEvents[E] | undefined) => void)(payload)
    }
    return on(event, wrapper as EventListener<E>)
  }

  const on = <E extends keyof ApiReferenceEvents>(event: E, listener: EventListener<E>): Unsubscribe => {
    const listeners = getListeners(event)
    listeners.add(listener as EventListener<keyof ApiReferenceEvents>)
    log(`Added listener for "${String(event)}" (${listeners.size} total)`)

    return () => off(event, listener)
  }

  const off = <E extends keyof ApiReferenceEvents>(event: E, listener: EventListener<E>): void => {
    const listeners = events.get(event)
    if (!listeners) {
      return
    }

    listeners.delete(listener as EventListener<keyof ApiReferenceEvents>)
    log(`Removed listener for "${String(event)}" (${listeners.size} remaining)`)

    // Clean up empty listener sets to avoid memory leaks
    if (listeners.size === 0) {
      events.delete(event)
    }
  }

  /**
   * Internal function that performs the actual emission logic
   * This is extracted so it can be wrapped with debouncing
   */
  const performEmit = <E extends keyof ApiReferenceEvents>(
    event: E,
    payload: ApiReferenceEvents[E] | undefined,
    options?: { skipUnpackProxy?: boolean },
  ): void => {
    // We unpack the payload here to ensure that, within mutators, we are not assigning proxies directly,
    // but are always assigning plain objects 5 level depth.
    const unpackedPayload = options?.skipUnpackProxy ? payload : unpackProxyObject(payload, { depth: 5 })

    const listeners = events.get(event)
    const hasExactListeners = listeners && listeners.size > 0

    if (!hasExactListeners && wildcardListeners.size === 0) {
      log(`🛑 No listeners for "${String(event)}"`)
      return
    }

    // Execute exact-match listeners
    if (hasExactListeners) {
      log(`Emitting "${String(event)}" to ${listeners.size} listener(s)`, payload)

      // Convert to array to avoid issues if listeners modify the set during iteration
      const listenersArray = Array.from(listeners)

      for (const listener of listenersArray) {
        try {
          listener(unpackedPayload)
        } catch (error) {
          // Do not let one listener error break other listeners
          console.error(`[EventBus] Error in listener for "${String(event)}":`, error)
        }
      }
    }

    // Notify wildcard / glob listeners whose pattern matches this event.
    // We iterate over all registered patterns — in practice this set is tiny
    // (one or two patterns at most), so the linear scan costs essentially nothing.
    if (wildcardListeners.size > 0) {
      for (const [pattern, wListeners] of wildcardListeners) {
        if (wListeners.size === 0 || !matchesGlob(pattern, event)) {
          continue
        }

        log(`Emitting "${String(event)}" to ${wListeners.size} wildcard listener(s) for pattern "${pattern}"`, payload)

        const wListenersArray = Array.from(wListeners)
        for (const wListener of wListenersArray) {
          try {
            ;(wListener as (event: keyof ApiReferenceEvents, payload: unknown) => void)(event, unpackedPayload)
          } catch (error) {
            console.error(
              `[EventBus] Error in wildcard listener for pattern "${pattern}" (event "${String(event)}"):`,
              error,
            )
          }
        }
      }
    }
  }

  const emit = <E extends keyof ApiReferenceEvents>(...args: EmitParameters<E>): void => {
    const [event, payload, options] = args

    // If no debounce key is provided, emit immediately
    if (!options?.debounceKey) {
      performEmit(event, payload, options)
      return
    }

    // Create a unique key for this event + debounce key combination
    const debounceMapKey = `${event}-${options.debounceKey}`

    // Pass the closure directly - debounce will store the latest version
    debouncedEmitter(debounceMapKey, () => performEmit(event, payload, options))
  }

  const onGlob = (pattern: EventGlob, listener: WildcardListener): Unsubscribe => {
    const listeners = getWildcardListeners(pattern)
    listeners.add(listener)
    log(`Added glob listener for pattern "${pattern}" (${listeners.size} total)`)

    return () => offGlob(pattern, listener)
  }

  const offGlob = (pattern: EventGlob, listener: WildcardListener): void => {
    const listeners = wildcardListeners.get(pattern)
    if (!listeners) {
      return
    }

    listeners.delete(listener)
    log(`Removed glob listener for pattern "${pattern}" (${listeners.size} remaining)`)

    // Clean up empty sets to avoid memory leaks
    if (listeners.size === 0) {
      wildcardListeners.delete(pattern)
    }
  }

  const flushDebouncedEmits = (): void => {
    flushDebouncedEmitters()
  }

  return {
    on,
    once,
    off,
    onGlob,
    offGlob,
    emit,
    flushDebouncedEmits,
  }
}
