import { debounce } from '@scalar/helpers/general/debounce'

import { unpackProxyObject } from '@/helpers/unpack-proxy'

import type { ApiReferenceEvents } from './definitions'

type Unsubscribe = () => void

/**
 * Helper type for event listeners that makes the payload optional
 * if the event allows undefined, otherwise requires it.
 */
type EventListener<E extends keyof ApiReferenceEvents> = undefined extends ApiReferenceEvents[E]
  ? (payload?: ApiReferenceEvents[E]) => void
  : (payload: ApiReferenceEvents[E]) => void

/**
 * Tagged-union representation of every event — one branch per event key, each
 * pairing the event name with its specific payload type.
 *
 * Because `event` acts as the discriminant, TypeScript narrows `payload` to
 * the exact type of the matched event when you check `event === '...'` inside
 * a listener (including when the argument is destructured).
 */
export type AnyEvent = {
  [E in keyof ApiReferenceEvents]: { event: E; payload: ApiReferenceEvents[E] }
}[keyof ApiReferenceEvents]

/**
 * Listener type for `onAny` subscriptions.
 *
 * Receives a single tagged-union object containing the concrete `event` name
 * and its `payload`. Narrowing on `event` narrows `payload` to the exact type
 * for that event — no manual casting or runtime payload checks required just
 * to satisfy types.
 *
 * @example
 * bus.onAny(({ event, payload }) => {
 *   if (event === 'log:user-login') {
 *     // payload is { uid: string; email?: string; teamUid: string }
 *     posthog.identify(payload.uid)
 *   }
 * })
 */
export type AnyEventListener = (event: AnyEvent) => void

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
 * - Listen to every event via `onAny` / `offAny`
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
   * Subscribe to every event emitted on the bus.
   *
   * The listener receives the concrete event name as the first argument and
   * the (proxy-unpacked) payload as the second. Use this on the consumer side
   * when you need to handle every event generically — for example, analytics,
   * logging, or forwarding events across a boundary.
   *
   * Because the listener type is a discriminated union over every event key,
   * narrowing on `event` inside the listener body also narrows `payload` to
   * its exact type.
   *
   * @param listener - Callback invoked for every emitted event
   * @returns Unsubscribe function to remove the listener
   *
   * @example
   * const off = bus.onAny((event, payload) => {
   *   if (event === 'log:user-login') {
   *     // payload is narrowed to the login payload type
   *     posthog.identify(payload.uid)
   *   }
   * })
   *
   * // Clean up
   * off()
   */
  onAny(listener: AnyEventListener): Unsubscribe

  /**
   * Remove a wildcard listener previously registered with `onAny`.
   *
   * @param listener - The listener function to remove
   *
   * @example
   * const handler = (event, payload) => console.log(event, payload)
   * bus.onAny(handler)
   * bus.offAny(handler)
   */
  offAny(listener: AnyEventListener): void

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
   * Set of wildcard listeners that receive every emitted event.
   * Using a Set keeps add/remove O(1) and iteration order stable.
   */
  const anyListeners = new Set<AnyEventListener>()

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
        // Multiple logs, use a collapsed group
        console.groupCollapsed(`[EventBus] ${pendingLogs.length} operations`)
        for (const { message, args } of pendingLogs) {
          console.log(message, ...args)
        }
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

  const onAny = (listener: AnyEventListener): Unsubscribe => {
    anyListeners.add(listener)
    log(`Added wildcard listener (${anyListeners.size} total)`)

    return () => offAny(listener)
  }

  const offAny = (listener: AnyEventListener): void => {
    anyListeners.delete(listener)
    log(`Removed wildcard listener (${anyListeners.size} remaining)`)
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
    const hasExactListeners = listeners !== undefined && listeners.size > 0

    if (!hasExactListeners && anyListeners.size === 0) {
      log(`🛑 No listeners for "${String(event)}"`)
      return
    }

    // Execute exact-match listeners first so the deterministic, type-specific
    // handlers see the event before any generic/wildcard observers.
    if (hasExactListeners && listeners) {
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

    // Notify wildcard listeners after specific ones have run.
    if (anyListeners.size > 0) {
      log(`Emitting "${String(event)}" to ${anyListeners.size} wildcard listener(s)`, payload)

      // Build the tagged-union argument once and reuse it across listeners.
      // The cast bridges from the loose internal `(event, payload)` pair to
      // the discriminated-union shape exposed to consumers.
      const anyEvent = { event, payload: unpackedPayload } as AnyEvent

      const anyListenersArray = Array.from(anyListeners)
      for (const listener of anyListenersArray) {
        try {
          listener(anyEvent)
        } catch (error) {
          console.error(`[EventBus] Error in wildcard listener for "${String(event)}":`, error)
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

  const flushDebouncedEmits = (): void => {
    flushDebouncedEmitters()
  }

  return {
    on,
    once,
    off,
    onAny,
    offAny,
    emit,
    flushDebouncedEmits,
  }
}
