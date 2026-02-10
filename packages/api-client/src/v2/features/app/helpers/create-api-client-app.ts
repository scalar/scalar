import { createApp } from 'vue'
import { createRouter as createVueRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import App from '@/v2/features/app/App.vue'
import { createAppState } from '@/v2/features/app/app-state'
import { ROUTES } from '@/v2/features/app/helpers/routes'
import type { ClientPlugin } from '@/v2/helpers/plugins'
import type { ClientLayout } from '@/v2/types/layout'

import { useCommandPaletteState } from '../../command-palette/hooks/use-command-palette-state'

type CreateApiClientOptions = {
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
export const createApiClientApp = async (
  el: HTMLElement | null,
  { layout = 'desktop', plugins }: CreateApiClientOptions,
) => {
  // Add the router
  const router = createAppRouter(layout)
  const state = await createAppState({ router })
  const commandPaletteState = useCommandPaletteState()

  // Pass in our initial props at the top level
  const app = createApp(App, {
    layout,
    plugins,
    getAppState: () => state,
    getCommandPaletteState: () => commandPaletteState,
  })
  app.use(router)

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

  return {
    app,
    state,
  }
}
