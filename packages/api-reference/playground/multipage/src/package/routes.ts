import type { RouteRecordRaw } from 'vue-router'

import Bar from './views/Bar.vue'
import Foo from './views/Foo.vue'

/**
 * All route names as an enum
 */
export const ROUTES = {
  FOO: 'scalar.foo',
  BAR: 'scalar.bar',
} as const

/**
 * All the routes, registered on the root level
 */
export const routes: (RouteRecordRaw & {
  name: (typeof ROUTES)[keyof typeof ROUTES]
})[] = [
  { path: '/foo', component: Foo, name: ROUTES.FOO },
  { path: '/bar', component: Bar, name: ROUTES.BAR },
].map((route) => {
  return {
    ...route,
    meta: {
      fromScalar: true,
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
