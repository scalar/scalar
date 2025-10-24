import type { ApiReferenceEvents } from './definitions'

type Unsubscribe = () => void

/** Helper type for listener wrappers */
type ListenerWrapper<E extends keyof ApiReferenceEvents> = {
  listener: (payload: ApiReferenceEvents[E]) => void
  once: boolean
}

/**
 * Type-safe event bus for workspace events
 *
 * This event bus provides:
 * - Full type safety for event names and payloads
 * - O(1) event lookups using Map
 * - Support for one-time listeners
 * - Automatic cleanup for once listeners
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
  on<E extends keyof ApiReferenceEvents>(event: E, listener: (payload: ApiReferenceEvents[E]) => void): Unsubscribe

  /**
   * Subscribe to an event that will only fire once
   *
   * @param event - The event name to listen for
   * @param listener - Callback function that receives the event detail
   * @returns Unsubscribe function to remove the listener
   *
   * @example
   * bus.once('scalar-on-loaded', (detail) => {
   *   console.log('Loaded!')
   * })
   */
  once<E extends keyof ApiReferenceEvents>(event: E, listener: (payload: ApiReferenceEvents[E]) => void): Unsubscribe

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
  off<E extends keyof ApiReferenceEvents>(event: E, listener: (payload: ApiReferenceEvents[E]) => void): void

  /**
   * Emit an event with its payload
   *
   * @param event - The event name to emit
   * @param detail - The event detail payload
   *
   * @example
   * bus.emit('scalar-update-sidebar', { value: true })
   */
  emit<E extends keyof ApiReferenceEvents>(event: E, payload: ApiReferenceEvents[E]): void
}

/**
 * Options for creating an event bus
 */
export type EventBusOptions = {
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
  const events = new Map<keyof ApiReferenceEvents, Set<ListenerWrapper<keyof ApiReferenceEvents>>>()

  /**
   * Get or create a listener set for an event
   */
  const getListeners = <T extends keyof ApiReferenceEvents>(event: T): Set<ListenerWrapper<T>> => {
    let listeners = events.get(event)

    if (!listeners) {
      listeners = new Set()
      events.set(event, listeners)
    }

    return listeners
  }

  /**
   * Log debug information if debug mode is enabled
   */
  const log = (message: string, ...args: any[]): void => {
    if (debug) {
      console.log(`[EventBus] ${message}`, ...args)
    }
  }

  const on = <E extends keyof ApiReferenceEvents>(
    event: E,
    listener: (payload: ApiReferenceEvents[E]) => void,
  ): Unsubscribe => {
    const listeners = getListeners(event)
    const wrapper: ListenerWrapper<E> = {
      listener,
      once: false,
    }

    listeners.add(wrapper)
    log(`Added listener for "${event}" (${listeners.size} total)`)

    return () => off(event, listener)
  }

  const once = <E extends keyof ApiReferenceEvents>(
    event: E,
    listener: (payload: ApiReferenceEvents[E]) => void,
  ): Unsubscribe => {
    const listeners = getListeners(event)
    const wrapper: ListenerWrapper<E> = {
      listener,
      once: true,
    }

    listeners.add(wrapper)
    log(`Added once listener for "${event}" (${listeners.size} total)`)

    return () => off(event, listener)
  }

  const off = <E extends keyof ApiReferenceEvents>(
    event: E,
    listener: (payload: ApiReferenceEvents[E]) => void,
  ): void => {
    const listeners = events.get(event)

    if (!listeners) {
      return
    }

    // Find and remove the wrapper that contains this listener
    for (const wrapper of listeners) {
      if (wrapper.listener === listener) {
        listeners.delete(wrapper)
        log(`Removed listener for "${event}" (${listeners.size} remaining)`)
        break
      }
    }

    // Clean up empty listener sets to avoid memory leaks
    if (listeners.size === 0) {
      events.delete(event)
    }
  }

  const emit = <E extends keyof ApiReferenceEvents>(event: E, payload: ApiReferenceEvents[E]): void => {
    const listeners = events.get(event)

    if (!listeners || listeners.size === 0) {
      log(`No listeners for "${event}"`)
      return
    }

    log(`Emitting "${event}" to ${listeners.size} listener(s)`, payload)

    // Convert to array to avoid issues if listeners modify the set during iteration
    const listenersArray = Array.from(listeners)
    const onceListeners: ListenerWrapper<any>[] = []

    // Execute all listeners
    for (const wrapper of listenersArray) {
      try {
        wrapper.listener(payload)

        if (wrapper.once) {
          onceListeners.push(wrapper)
        }
      } catch (error) {
        // Do not let one listener error break other listeners
        console.error(`[EventBus] Error in listener for "${event}":`, error)
      }
    }

    // Remove once listeners after all have executed
    for (const wrapper of onceListeners) {
      listeners.delete(wrapper)
    }

    // Clean up if no listeners remain
    if (listeners.size === 0) {
      events.delete(event)
    }
  }

  return {
    on,
    once,
    off,
    emit,
  }
}
