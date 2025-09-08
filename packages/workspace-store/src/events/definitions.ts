import type { AvailableClients } from '@scalar/snippetz'
import type { Simplify } from 'type-fest'

import type { ServerObject } from '@/schemas/v3.1/strict/openapi-document'

/**
 * Event definitions for scalar blocks
 *
 * Events can have a typed payload using the `data` property.
 */
export type ApiReferenceEvents<T extends keyof ServerObject = keyof ServerObject> = {
  'scalar-update-sidebar': {
    detail: {
      value: boolean
    }
  }
  'scalar-update-dark-mode': {
    detail: {
      value: boolean
    }
  }
  'scalar-update-active-document': {
    detail: {
      value: string
    }
  }
  /** Controls the selected client in our code example blocks */
  'scalar-update-selected-client': {
    detail: AvailableClients[number]
  }
  /** Controls the selected example key in our operation blocks + children */
  'scalar-update-selected-example': {
    detail: string
  }
  /** Controls the selected server URL in our server selector blocks */
  'scalar-update-selected-server': {
    detail: {
      value?: string
      options?: {
        /**
         * Update only new store
         *
         * Do not update the old store since it will be handled manually
         */
        disableOldStoreUpdate: boolean
      }
    }
  }
  /** Controls the selected server URL in our server selector blocks */
  'scalar-update-selected-server-variables': {
    detail: {
      key: string
      value: string
      options?: {
        /**
         * Update only new store
         *
         * Do not update the old store since it will be handled manually
         */
        disableOldStoreUpdate: boolean
      }
    }
  }
  'store-update-selected-server-properties': {
    detail: {
      key: T
      value: ServerObject[T]
      options?: {
        /**
         * Update only new store
         *
         * Do not update the old store since it will be handled manually
         */
        disableOldStoreUpdate: boolean
      }
    }
  }
  /** Replace all document servers */
  'scalar-replace-servers': {
    detail: {
      servers: ServerObject[]
      options?: {
        /**
         * Update only new store
         *
         * Do not update the old store since it will be handled manually
         */
        disableOldStoreUpdate: boolean
      }
    }
  }
  /** Add a new server to the active document */
  'scalar-add-server': {
    detail: {
      server: ServerObject
      options?: {
        /**
         * Update only new store
         *
         * Do not update the old store since it will be handled manually
         */
        disableOldStoreUpdate: boolean
      }
    }
  }
  /** Add a new server to the active document */
  'scalar-delete-server': {
    detail: {
      url: string
      options?: {
        /**
         * Update only new store
         *
         * Do not update the old store since it will be handled manually
         */
        disableOldStoreUpdate: boolean
      }
    }
  }

  /** Auth events */
  'scalar-select-security-schemes': {
    detail: {
      uids: string[]
    }
  }

  'scalar-select-operation-security-schemes': {
    detail: {
      operationUid: string
      uids: string[]
    }
  }

  'scalar-edit-security-scheme': {
    detail: {
      uid: string
      path: string
      value: any
    }
  }

  'scalar-add-auth-option': {
    detail: {
      payload: any
    }
  }

  'scalar-delete-security-scheme': {
    detail: {
      uid: string
    }
  }
}

export type ApiReferenceEvent = Simplify<keyof ApiReferenceEvents>

/**
 * Scalar blocks will use vanilla events to allow more flexibility in integrations
 *
 * Event can include typed payloads using the `data` property. A target for the dispatch must be provided.
 */
export function emitCustomEvent<E extends ApiReferenceEvent>(
  target: HTMLElement | null | undefined,
  event: E,
  detail: ApiReferenceEvents[E]['detail'],
) {
  const instance = new CustomEvent(event, {
    detail: detail,
    bubbles: true,
    composed: true,
    cancelable: true,
  })

  target?.dispatchEvent(instance)
}
