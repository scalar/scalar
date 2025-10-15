import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { type Component, createApp } from 'vue'

import { createRouter } from '@/v2/helpers/create-router'

/**
 * The layout of the client, also defines the router type and routes
 *
 * @default 'desktop'
 */
export type ClientLayout = 'modal' | 'web' | 'desktop'

export type CreateApiClientOptions = {
  /** Element to mount the references to */
  el: HTMLElement | null
  /** Main vue app component to create the vue app */
  appComponent: Component
  /** Persist the workspace to indexDB */
  // persistData?: boolean
  /**
   * Will attempt to mount the references immediately
   * For SSR this may need to be blocked and done client side
   */
  mountOnInitialize?: boolean
  /** The workspace store must be initialized and passed in */
  store: WorkspaceStore
  /**
   * The layout of the client
   * @see {@link ClientLayout}
   *
   * @default 'desktop'
   */
  layout?: ClientLayout
}

/**
 * Create the API Client with appropriate router/routes and pass in the store
 */
export const createApiClient = ({
  el,
  appComponent,
  store,
  mountOnInitialize = true,
  layout = 'desktop',
}: CreateApiClientOptions) => {
  const router = createRouter({ layout, store })

  const app = createApp(appComponent)
  app.use(router)

  // Set an id prefix for useId so we don't have collisions with other Vue apps
  app.config.idPrefix = 'scalar-client'

  // Mount the vue app
  const mount = (mountingEl = el) => {
    if (!mountingEl) {
      console.error(
        '[@scalar/api-client-modal] Could not create the API client.',
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

  return {
    /** The vue app instance for the modal, be careful with this */
    // app,
    /** Route to the specified method and path */
    route: () => {},
    /** Mount the client to a given element */
    mount,
  }
}
