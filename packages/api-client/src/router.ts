import { modalRoutes, routes } from '@/routes'
import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

export { PathId, saveActiveWorkspace } from '@/routes'

/** Router for the API client app */
export const createWebHistoryRouter = () =>
  createRouter({
    history: createWebHistory(),
    routes,
  })

/** Router factory for the API client app (but using hash history) */
export const createWebHashRouter = () =>
  createRouter({
    history: createWebHashHistory(),
    routes,
  })

/** Router factory for the API Client modal */
export const createModalRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: modalRoutes,
  })
