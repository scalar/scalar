import { useModal } from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { createApp, reactive } from 'vue'

import { Modal, type ModalProps } from '@/v2/features/modal/components'

export type CreateApiClientModalOptions = {
  /** Element to mount the client modal to */
  el: HTMLElement | null
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be disabled and handled manually on the client side
   */
  mountOnInitialize?: boolean
  /** The workspace store must be initialized and passed in */
  workspaceStore: WorkspaceStore
}

/** Payload for routing and opening the API client modal */
type RoutePayload = {
  path: string
  method: string
  example: string
  documentSlug?: string
}

export type ActiveEntities = Required<RoutePayload>

/**
 * Create the API Client Modal
 *
 * The new API Client Modal doesn't require a router, instead we can "route" by setting the active entities directly
 */
export const createApiClientModal = ({ el, workspaceStore, mountOnInitialize = true }: CreateApiClientModalOptions) => {
  const defaultEntities = {
    path: 'default',
    method: 'default',
    example: 'default',
    documentSlug: workspaceStore.workspace['x-scalar-active-document'] || 'default',
  }

  /** Current active entities */
  const activeEntities = reactive(defaultEntities)

  /** Controls the visibility of the modal */
  const modalState = useModal()

  // Pass in our initial props at the top level
  const app = createApp(Modal, {
    workspaceStore,
    activeEntities,
    modalState,
  } satisfies ModalProps)

  // Set an id prefix for useId so we don't have collisions with other Vue apps
  app.config.idPrefix = 'scalar-client'

  /** Mount the client to a given element */
  const mount = (mountingEl = el) => {
    if (!mountingEl) {
      console.error(
        '[@scalar/api-client] Could not create the API client Modal.',
        'Invalid HTML element provided.',
        'Read more: https://github.com/scalar/scalar/tree/main/packages/api-client',
      )

      return
    }
    app.mount(mountingEl)
  }
  if (mountOnInitialize) {
    mount()
  }

  /** "Route" to the specified path, method and example */
  const route = (payload: RoutePayload) => Object.assign(activeEntities, defaultEntities, payload)

  return {
    /** The vue app instance for the modal, be careful with this */
    app,
    /** Open the API client modal and set the current path, method and example */
    open: (payload?: RoutePayload) => {
      modalState.open = true
      if (payload) {
        route(payload)
      }
    },
    /** Mount the client to a given element */
    mount,
    /** "Route" to the specified path, method and example */
    route,
    /** Controls the visibility of the modal */
    modalState,
  }
}
