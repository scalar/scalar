import {
  type RouteLocationNormalized,
  type RouteRecordRaw,
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'

export enum PathId {
  Request = 'request',
  Examples = 'examples',
  Cookies = 'cookies',
  Collection = 'collection',
  Schema = 'schema',
  Environment = 'environment',
  Servers = 'servers',
  Workspace = 'workspace',
}

/** Shared request routes between modal and app */
const requestRoutes = [
  {
    path: '',
    redirect: (to) => `${to.fullPath.replace(/\/$/, '')}/request/default`,
  },
  {
    path: 'request',
    redirect: (to) => `${to.fullPath.replace(/\/$/, '')}/default`,
  },
  {
    name: PathId.Request,
    path: `request/:${PathId.Request}`,
    component: () => import('@/views/Request/Request.vue'),
  },
  {
    name: PathId.Examples,
    path: `request/:${PathId.Request}/examples/:${PathId.Examples}`,
    component: () => import('@/views/Request/Request.vue'),
  },
] satisfies RouteRecordRaw[]

/** Routes required by the API client modal */
export const modalRoutes = [
  {
    path: '/',
    redirect: '/workspace/default/request/default',
  },
  {
    path: '/workspace',
    redirect: '/workspace/default/request/default',
  },
  {
    path: `/workspace/:${PathId.Workspace}`,
    children: requestRoutes,
  },
] satisfies RouteRecordRaw[]

/** Routes for the API client app */
const routes = [
  {
    path: '/',
    redirect: redirectToDefaultWorkspace,
  },
  {
    path: '/workspace',
    redirect: redirectToDefaultWorkspace,
  },
  {
    path: `/workspace/:${PathId.Workspace}`,
    children: [
      ...requestRoutes,
      // {
      //   path: 'collection',
      //   redirect: (to) =>
      //     `${to.fullPath.replace(/\/$/, '')}/default`,
      // },
      // {
      //   name: PathId.Collection,
      //   path: `collection/:${PathId.Collection}`,
      //   component: () => import('@/views/Collection/Collection.vue'),
      //   children: [
      //     // Nested collection request
      //     {
      //       path: `request/${PathId.Request}`,
      //       component: () => import('@/views/Request/Request.vue'),
      //     },
      //   ],
      // },
      /** Components will map to each section of the spec components object */
      // {
      //   path: 'components',
      //   redirect: '/components/schemas/default',
      //   children: [
      //     {
      //       path: `schemas/:${PathId.Schema}`,
      //       component: () => import('@/views/Components/Schemas/Schemas.vue'),
      //     },
      //   ],
      // },
      {
        path: 'environment',
        redirect: (to) => `${to.fullPath.replace(/\/$/, '')}/default`,
      },
      {
        name: PathId.Environment,
        path: `environment/:${PathId.Environment}`,
        component: () => import('@/views/Environment/Environment.vue'),
      },
      {
        path: 'cookies',
        redirect: (to) => `${to.fullPath.replace(/\/$/, '')}/default`,
      },
      {
        name: PathId.Cookies,
        path: `cookies/:${PathId.Cookies}`,
        component: () => import('@/views/Cookies/Cookies.vue'),
      },
      {
        path: 'servers',
        redirect: (to) => `${to.fullPath.replace(/\/$/, '')}/default`,
      },
      {
        name: PathId.Servers,
        path: `servers/:${PathId.Servers}`,
        component: () => import('@/views/Servers/Servers.vue'),
      },
    ],
  },
] satisfies RouteRecordRaw[]

/** Router for the API client app */
export const router = createRouter({
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
