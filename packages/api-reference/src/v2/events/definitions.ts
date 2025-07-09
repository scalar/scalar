import type { AvailableClients } from '@scalar/snippetz'

/**
 * Event definitions for scalar blocks
 *
 * Events can have a typed payload using the `data` property.
 */
export type ApiReferenceEvents = {
  'scalar-update-sidebar': {
    data: {
      value: boolean
    }
  }
  'scalar-update-dark-mode': {
    data: {
      value: boolean
    }
  }
  'scalar-update-active-document': {
    data: {
      value: string
    }
  }
  /** Controls the selected client in our code example blocks */
  'scalar-update-selected-client': {
    data: AvailableClients[number]
  }
  /** Controls the selected example key in our operation blocks + children */
  'scalar-update-selected-example': {
    data: string
  }
}

export type ApiReferenceEvent = Prettify<keyof ApiReferenceEvents>

/**
 * Scalar blocks will use vanilla events to allow more flexibility in integrations
 *
 * Event can include typed payloads using the `data` property. A target for the dispatch must be provided.
 */
export function emitCustomEvent<E extends ApiReferenceEvent>(
  target: HTMLElement,
  event: E,
  data: ApiReferenceEvents[E]['data'],
) {
  const instance = new CustomEvent(event, { detail: data, bubbles: true, composed: true, cancelable: true })

  target.dispatchEvent(instance)
}

/** Type helper for expanding complex types */
type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}
