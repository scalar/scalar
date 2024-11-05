import {
  type RouteLocationNormalized,
  type RouteRecordRaw,
  type Router,
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
  Settings = 'settings',
}

/** Shared request routes between modal and app */
const requestRoutes = [
  {
    name: 'request.root',
    path: '',
    redirect: (to) => ({
      name: 'request',
      params: { ...to.params, request: 'default' },
    }),
  },
  {
    name: 'request.default',
    path: 'request',
    redirect: (to) => ({
      name: 'request',
      params: { ...to.params, request: 'default' },
    }),
  },
  {
    name: 'request',
    path: `request/:${PathId.Request}`,
    component: () => import('@/views/Request/Request.vue'),
  },
  {
    name: 'request.examples',
    path: `request/:${PathId.Request}/examples/:${PathId.Examples}`,
    component: () => import('@/views/Request/Request.vue'),
  },
] satisfies RouteRecordRaw[]

/** Routes required by the API client modal */
export const modalRoutes = [
  {
    name: 'root',
    path: '/',
    redirect: '/workspace/default/request/default',
  },
  {
    name: 'workspace.default',
    path: '/workspace',
    redirect: '/workspace/default/request/default',
  },
  {
    name: 'workspace',
    path: `/workspace/:${PathId.Workspace}`,
    children: requestRoutes,
  },
] satisfies RouteRecordRaw[]

/** Routes for the API client app */
const routes = [
  {
    name: 'root',
    path: '/',
    redirect: redirectToDefaultWorkspace,
  },
  {
    name: 'workspace.default',
    path: '/workspace',
    redirect: redirectToDefaultWorkspace,
  },
  {
    name: 'workspace',
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
        name: 'environment.default',
        path: 'environment',
        redirect: (to) => ({
          name: 'environment',
          params: { ...to.params, environment: 'default' },
        }),
      },
      {
        name: 'environment',
        path: `environment/:${PathId.Environment}`,
        component: () => import('@/views/Environment/Environment.vue'),
      },
      {
        name: 'cookies.default',
        path: 'cookies',
        redirect: (to) => ({
          name: 'cookies',
          params: { ...to.params, cookies: 'default' },
        }),
      },
      {
        name: 'cookies',
        path: `cookies/:${PathId.Cookies}`,
        component: () => import('@/views/Cookies/Cookies.vue'),
      },
      {
        name: 'servers.default',
        path: 'servers',
        redirect: (to) => ({
          name: 'servers',
          params: { ...to.params, servers: 'default' },
        }),
      },
      {
        name: 'servers',
        path: `servers/:${PathId.Servers}`,
        component: () => import('@/views/Servers/Servers.vue'),
      },
      {
        name: 'settings.default',
        path: 'settings',
        redirect: (to) => ({
          name: 'settings',
          params: { ...to.params, settings: 'general' },
        }),
      },
      {
        name: 'settings',
        path: `settings/:${PathId.Settings}`,
        component: () => import('@/views/Settings/Settings.vue'),
      },
    ],
  },
] satisfies RouteRecordRaw[]

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
