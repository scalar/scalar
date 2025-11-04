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
 */
type EmitParameters<E extends keyof ApiReferenceEvents> = undefined extends ApiReferenceEvents[E]
  ? [event: E, payload?: ApiReferenceEvents[E]]
  : [event: E, payload: ApiReferenceEvents[E]]

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
   *
   * @example
   * bus.emit('scalar-update-sidebar', { value: true })
   */
  emit<E extends keyof ApiReferenceEvents>(...args: EmitParameters<E>): void
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
  type ListenerSet = Set<EventListener<keyof ApiReferenceEvents>>
  const events = new Map<keyof ApiReferenceEvents, ListenerSet>()

  /**
   * Get or create a listener set for an event
   */
  const getListeners = <E extends keyof ApiReferenceEvents>(event: E): ListenerSet => {
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
  const log = (message: string, ...args: unknown[]): void => {
    if (debug) {
      console.log(`[EventBus] ${message}`, ...args)
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

  const emit = <E extends keyof ApiReferenceEvents>(...args: EmitParameters<E>): void => {
    const [event, payload] = args
    const listeners = events.get(event)

    if (!listeners || listeners.size === 0) {
      log(`No listeners for "${String(event)}"`)
      return
    }

    log(`Emitting "${String(event)}" to ${listeners.size} listener(s)`, payload)

    // Convert to array to avoid issues if listeners modify the set during iteration
    const listenersArray = Array.from(listeners)

    // Execute all listeners
    for (const listener of listenersArray) {
      try {
        listener(payload)
      } catch (error) {
        // Do not let one listener error break other listeners
        console.error(`[EventBus] Error in listener for "${String(event)}":`, error)
      }
    }
  }

  return {
    on,
    off,
    emit,
  }
}
