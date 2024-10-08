import type { RouteRecordRaw } from 'vue-router'

import Bar from './views/Bar.vue'
import Introduction from './views/Introduction.vue'
import Operation from './views/Operation.vue'
import Tag from './views/Tag.vue'

/**
 * All route names as an enum
 */
export const ROUTE_NAMES = {
  INTRODUCTION: 'scalar.introduction',
  BAR: 'scalar.bar',
  TAG: 'scalar.tag',
  OPERATION: 'scalar.operation',
} as const

export type RouteName = (typeof ROUTE_NAMES)[keyof typeof ROUTE_NAMES]

/**
 * All the routes, registered on the root level
 */
export const routes: (RouteRecordRaw & {
  name: RouteName
})[] = [
  { path: '/', component: Introduction, name: ROUTE_NAMES.INTRODUCTION },
  { path: '/bar', component: Bar, name: ROUTE_NAMES.BAR },
  {
    path: '/:tag',
    component: Tag,
    name: ROUTE_NAMES.TAG,
  },
  {
    path: '/tag/:tag/:method/:path',
    component: Operation,
    name: ROUTE_NAMES.OPERATION,
  },
].map((route) => {
  return {
    ...route,
    meta: {
      // Helps us to hook into our routes only
      scalar: true,
    },
  }
})

/**
 * All the routes, but without a leading slash
 */
export const routesAsChildren = routes.map((route) => ({
  ...route,
  path: route.path.replace(/^\//, ''),
}))
