import {
  createMemoryHistory,
  createRouter as createVueRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

import type { CreateApiClientOptions } from '@/v2/helpers/create-api-client'

import { appRoutes, modalRoutes } from './routes'

/**
 * Creates the appropriate router with the appropriate routes based on the layout
 */
export const createRouter = ({ layout = 'desktop', store }: Pick<CreateApiClientOptions, 'layout' | 'store'>) => {
  switch (layout) {
    // Modal is missing the workspace routes
    case 'modal':
      return createVueRouter({ history: createMemoryHistory(), routes: modalRoutes })
    // Web uses the standard HTML5 history API
    case 'web':
      return createVueRouter({ history: createWebHistory(), routes: appRoutes })
    // Electron app has to use the webHashHistory due to file routing
    case 'desktop':
    default:
      return createVueRouter({ history: createWebHashHistory(), routes: appRoutes })
  }
}
