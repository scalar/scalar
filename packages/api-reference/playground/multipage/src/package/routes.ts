import type { RouteRecordRaw } from 'vue-router'

import Bar from './views/Bar.vue'
import Foo from './views/Foo.vue'

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

/**
 * All the routes, registered on the root level
 */
export const routes: WithRequired<RouteRecordRaw, 'name'>[] = [
  { path: '/foo', component: Foo, name: 'scalar.foo' },
  { path: '/bar', component: Bar, name: 'scalar.bar' },
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
