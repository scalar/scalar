export type EventBusListener<P = any> = (payload?: P) => void

export type EventBus<P> = {
  /**
   * Subscribe to an event. When calling emit, the listeners will execute.
   * @param listener watch listener.
   * @returns a stop function to remove the current callback.
   */
  on: (listener: EventBusListener<P>) => () => void
  /**
   * Similar to `on`, but only fires once
   * @param listener watch listener.
   * @returns a stop function to remove the current callback.
   */
  once: (listener: EventBusListener<P>) => () => void
  /**
   * Emit an event, the corresponding event listeners will execute.
   * @param event data sent.
   */
  emit: (payload?: P) => void
  /**
   * Remove the corresponding listener.
   * @param listener watch listener.
   */
  off: (listener: EventBusListener<P>) => void
  /**
   * Clear all events
   */
  reset: () => void
  /**
   * Fetches an array of all active listeners
   */
  listeners: () => EventBusListener<P>[]
}

/**
 * Creates a ClientEvent with a payload of type P
 *
 * Modified from `@vueuse/core/useEventBus`
 * @see https://github.com/vueuse/vueuse/tree/v10.10.0/packages/core/useEventBus
 */
export function createEventBus<P = any>(): EventBus<P> {
  const listeners = new Set<EventBusListener<P>>()

  function on(listener: EventBusListener<P>) {
    listeners.add(listener)

    const _off = () => off(listener)
    return _off
  }

  function once(listener: EventBusListener<P>) {
    function _listener(...args: any[]) {
      off(_listener)
      listener(...args)
    }
    return on(_listener)
  }

  function off(listener: EventBusListener<P>): void {
    listeners.delete(listener)
  }

  function reset() {
    listeners.clear()
  }

  function emit(payload?: P) {
    listeners?.forEach((v) => v(payload))
  }

  return {
    on,
    once,
    off,
    emit,
    reset,
    listeners: () => Array.from(listeners),
  }
}
