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
   * Track pending log entries for batching
   */
  type PendingLogEntry = { message: string; args: unknown[] }
  const pendingLogs: PendingLogEntry[] = []
  let logTimeout: ReturnType<typeof setTimeout> | null = null

  /**
   * Single debounce instance for all debounced emits
   * Uses keys to separate different event + debounceKey combinations
   */
  const { execute: debouncedEmitter } = debounce({ delay: 328 })

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

    if (!listeners || listeners.size === 0) {
      log(`🛑 No listeners for "${String(event)}"`)
      return
    }

    log(`Emitting "${String(event)}" to ${listeners.size} listener(s)`, payload)

    // Convert to array to avoid issues if listeners modify the set during iteration
    const listenersArray = Array.from(listeners)

    // Execute all listeners
    for (const listener of listenersArray) {
      try {
        listener(unpackedPayload)
      } catch (error) {
        // Do not let one listener error break other listeners
        console.error(`[EventBus] Error in listener for "${String(event)}":`, error)
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

  return {
    on,
    off,
    emit,
  }
}
