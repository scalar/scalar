import {
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
    path: 'collection',
    redirect: (to) => `${to.fullPath.replace(/\/$/, '')}/default`,
  },
  {
    name: PathId.Collection,
    path: `collection/:${PathId.Collection}`,
    component: () => import('@/views/Collection/CollectionContainer.vue'),
    children: [
      {
        path: '',
        name: 'ignore',
        component: () => import('@/views/Collection/Collection.vue'),
      },
      {
        path: 'request',
        redirect: (to) => `${to.fullPath.replace(/\/$/, '')}/default`,
      },
      {
        name: PathId.Request,
        path: `request/:${PathId.Request}`,
        component: () => import('@/views/Collection/Request.vue'),
      },
      {
        name: PathId.Examples,
        path: `request/:${PathId.Request}/examples/:${PathId.Examples}`,
        component: () => import('@/views/Collection/Request.vue'),
      },
    ],
  },
] satisfies RouteRecordRaw[]

/** Routes required by the API client modal */
export const modalRoutes = [
  {
    path: '/',
    redirect: '/workspace/default/collection/default/request/default',
  },
  {
    path: '/workspace',
    redirect: '/workspace/default/collection/default/request/default',
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
    redirect: '/workspace/default/collection/default/request/default',
  },
  {
    path: '/workspace',
    redirect: '/workspace/default/collection/default/request/default',
  },
  {
    path: `/workspace/:${PathId.Workspace}`,
    children: [
      ...requestRoutes,
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

/** Router for the API client app (but using hash history) */
export const webHashRouter = createRouter({
  history: createWebHashHistory(),
  routes,
})

/** Router factory for the API Client modal */
export const createModalRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: modalRoutes,
  })

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
