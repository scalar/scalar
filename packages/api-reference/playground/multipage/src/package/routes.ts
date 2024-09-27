import type { RouteRecordRaw } from 'vue-router'

import Bar from './views/Bar.vue'
import Foo from './views/Foo.vue'

/**
 * All route names as an enum
 */
export const ROUTE_NAMES = {
  FOO: 'scalar.foo',
  BAR: 'scalar.bar',
} as const

export type RouteName = (typeof ROUTE_NAMES)[keyof typeof ROUTE_NAMES]

/**
 * All the routes, registered on the root level
 */
export const routes: (RouteRecordRaw & {
  name: RouteName
})[] = [
  { path: '/', component: Foo, name: ROUTE_NAMES.FOO },
  { path: '/bar', component: Bar, name: ROUTE_NAMES.BAR },
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
