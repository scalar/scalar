import { createRouter as createVueRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import type { CreateApiClientOptions } from '@/v2/helpers/create-api-client'

import { appRoutes } from './routes'

/**
 * Creates the appropriate router with the appropriate routes based on the layout
 */
export const createRouter = (layout: CreateApiClientOptions['layout']) => {
  // Web uses the standard HTML5 history API
  if (layout === 'web') {
    return createVueRouter({ history: createWebHistory(), routes: appRoutes })
  }

  // Electron app has to use the webHashHistory due to file routing
  return createVueRouter({ history: createWebHashHistory(), routes: appRoutes })
}
