import type { RouteRecordRaw } from 'vue-router'

import Bar from './views/Bar.vue'
import Foo from './views/Foo.vue'

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export const routes: WithRequired<RouteRecordRaw, 'name'>[] = [
  { path: '/foo', component: Foo, name: 'foo' },
  { path: '/bar', component: Bar, name: 'bar' },
]
