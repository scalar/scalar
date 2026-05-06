import type { ApiClientOptions, ClientLayout } from '@scalar/api-client/types'
import { createRouter as createVueRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import { ROUTES } from '@/features/app/helpers/routes'

/**
 * Runtime behaviour overrides shared between the api client app and createAppState.
 * Derived from the canonical ApiClientOptions to guarantee structural compatibility.
 */
export type ApiClientAppOptions = Pick<ApiClientOptions, 'customFetch' | 'oauth2RedirectUri'>

/**
 * Creates the appropriate router with the appropriate routes based on the layout
 */
export const createAppRouter = (layout: Exclude<ClientLayout, 'modal'>) => {
  // Web uses the standard HTML5 history API
  if (layout === 'web') {
    return createVueRouter({ history: createWebHistory(), routes: ROUTES })
  }

  // Electron app has to use the webHashHistory due to file routing
  return createVueRouter({ history: createWebHashHistory(), routes: ROUTES })
}
