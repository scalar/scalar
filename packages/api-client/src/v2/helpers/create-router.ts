import {
  createMemoryHistory,
  createRouter as createVueRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

import type { CreateApiClientOptions } from '@/v2/helpers/create-api-client'

/**
 * Creates the appropriate router with the appropriate routes based on the layout
 */
export const createRouter = ({ layout = 'desktop', store }: Pick<CreateApiClientOptions, 'layout' | 'store'>) => {
  switch (layout) {
    case 'web':
      return createVueRouter({ history: createWebHistory(), routes: [] })
    case 'modal':
      return createVueRouter({ history: createMemoryHistory(), routes: [] })
    case 'desktop':
    default:
      return createVueRouter({ history: createWebHashHistory(), routes: [] })
  }
}
