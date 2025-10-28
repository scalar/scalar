import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { createApp } from 'vue'
import { createRouter as createVueRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import App from '@/v2/features/app/components/App.vue'
import { ROUTES, type RouteProps } from '@/v2/features/app/helpers/routes'
import type { ClientPlugin } from '@/v2/plugins'
import type { ClientLayout } from '@/v2/types/layout'

export type CreateApiClientOptions = {
  /**
   * The layout of the client, limited to web or desktop in app
   * @see {@link ClientLayout}
   *
   * @default 'desktop'
   */
  layout: Exclude<ClientLayout, 'modal'>
  /**
   * Api client plugins to include in the app
   */
  plugins?: ClientPlugin[]
}

/**
 * Creates the appropriate router with the appropriate routes based on the layout
 */
export const createAppRouter = (layout: CreateApiClientOptions['layout']) => {
  // Web uses the standard HTML5 history API
  if (layout === 'web') {
    return createVueRouter({ history: createWebHistory(), routes: ROUTES })
  }

  // Electron app has to use the webHashHistory due to file routing
  return createVueRouter({ history: createWebHashHistory(), routes: ROUTES })
}

/**
 * Create the API Client with router and passes in the workspace store as a prop
 */
export const createApiClientApp = (
  el: HTMLElement | null,
  workspaceStore: WorkspaceStore,
  { layout = 'desktop' }: CreateApiClientOptions,
) => {
  // Pass in our initial props at the top level
  const app = createApp(App, { workspaceStore, layout } satisfies RouteProps)

  // Add the router
  app.use(createAppRouter(layout))

  // Mount the vue app
  if (!el) {
    console.error(
      '[@scalar/api-client-modal] Could not create the API client.',
      'Invalid HTML element provided.',
      'Read more: https://github.com/scalar/scalar/tree/main/packages/api-client',
    )

    return
  }
  app.mount(el)
}
