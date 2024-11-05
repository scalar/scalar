import { PathId, modalRoutes, routes } from '@/routes'
import {
  type RouteLocationNormalized,
  type Router,
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

export { PathId } from '@/routes'

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

/** Tracks the active workspace in localstorage for when the client reloads */
const WORKSPACE_KEY = 'activeWorkspace' as const

/** Save the active workspace in localstorage for when the client reloads */
export function saveWorkspace(to: RouteLocationNormalized) {
  const workspace = to.params[PathId.Workspace]
  if (workspace) localStorage.setItem(WORKSPACE_KEY, `${workspace}`)
}

/** Redirect to the saved workspace or the default workspace */
export function redirectToDefaultWorkspace() {
  const workspace = localStorage.getItem(WORKSPACE_KEY) ?? 'default'
  return `/workspace/${workspace}/request/default`
}

/** If we try to navigate to a entity UID that does not exist then we fallback to the default */
export function fallbackMissingParams(
  router: Router,
  key: PathId,
  item: Record<string, any> | undefined,
) {
  // If the item is missing and we are a route that uses that item we fallback to the default
  if (
    router.currentRoute.value &&
    // If the item is missing then we know the UID is no longer in use and redirect to the default
    !item &&
    router.currentRoute.value?.params[key] &&
    router.currentRoute.value?.params[key] !== 'default' &&
    // We only redirect if the key is missing for the matching route
    router.currentRoute.value.path.includes(key)
  ) {
    router.push({
      params: {
        ...router.currentRoute.value.params,
        [key]: 'default',
      },
    })
  }
}
