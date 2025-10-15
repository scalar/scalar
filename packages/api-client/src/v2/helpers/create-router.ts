import {
  createMemoryHistory,
  createRouter as createVueRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

import type { CreateApiClientOptions } from '@/v2/helpers/create-api-client'
import { modalRoutes } from '@/v2/helpers/create-routes'

/**
 * Creates the appropriate router with the appropriate routes based on the layout
 */
export const createRouter = ({ layout = 'desktop', store }: Pick<CreateApiClientOptions, 'layout' | 'store'>) => {
  switch (layout) {
    // Modal is missing the workspace routes
    case 'modal':
      return createVueRouter({ history: createMemoryHistory(), routes: modalRoutes })
    // Deskop and web have the same routes
    case 'desktop':
      return createVueRouter({ history: createWebHashHistory(), routes: [] })
    case 'web':
    default:
      return createVueRouter({ history: createWebHistory(), routes: [] })
  }
}
