import { computed } from 'vue'
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'

export enum PathId {
  Request = 'request',
  Example = 'example',
  Cookies = 'cookies',
  Collection = 'collection',
  Schema = 'schema',
  Environment = 'environment',
  Server = 'server',
}

/** Routes required by the client modal */
export const clientRoutes = [
  { path: '/', redirect: '/request/default' },
  {
    path: '/request',
    redirect: '/request/default',
  },
  {
    path: `/request/:${PathId.Request}`,
    component: () => import('@/views/Request/Request.vue'),
  },
  {
    path: `/request/:${PathId.Request}/example/:${PathId.Example}`,
    component: () => import('@/views/Request/Request.vue'),
  },
]

const routes = [
  ...clientRoutes,
  {
    path: '/collection',
    redirect: '/collection/default',
  },
  {
    name: PathId.Collection,
    path: `/collection/:${PathId.Collection}`,
    component: () => import('@/views/Collection/Collection.vue'),
    children: [
      // Nested collection request
      {
        path: `request/${PathId.Request}`,
        component: () => import('@/views/Request/Request.vue'),
      },
    ],
  },
  /** Components will map to each section of the spec components object */
  {
    path: '/components',
    redirect: '/components/schemas/default',
    children: [
      {
        path: `schemas/:${PathId.Schema}`,
        component: () => import('@/views/Components/Schemas/Schemas.vue'),
      },
    ],
  },
  {
    path: '/environment',
    redirect: '/environment/default',
  },
  {
    path: `/environment/:${PathId.Environment}`,
    component: () => import('@/views/Environment/Environment.vue'),
  },
  {
    path: '/cookies',
    redirect: '/cookies/default',
  },
  {
    path: `/cookies/:${PathId.Cookies}`,
    component: () => import('@/views/Cookies/Cookies.vue'),
  },
  {
    path: '/servers',
    redirect: '/servers/default',
  },
  {
    path: `/servers/:${PathId.Server}`,
    component: () => import('@/views/Servers/Servers.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

/** Creates the in memory client router */
export const clientRouter = createRouter({
  history: createMemoryHistory(),
  routes: clientRoutes,
})

export const activeRouterParams = computed(() => {
  const pathParams = {
    [PathId.Collection]: 'default',
    [PathId.Environment]: 'default',
    [PathId.Request]: 'default',
    [PathId.Example]: 'default',
    [PathId.Schema]: 'default',
    [PathId.Cookies]: 'default',
    [PathId.Server]: 'default',
  }

  // Snag current route from active router
  const currentRoute = clientRouter.currentRoute.value.matched.length
    ? clientRouter.currentRoute.value
    : router.currentRoute.value

  if (currentRoute) {
    Object.values(PathId).forEach((k) => {
      if (currentRoute.params[k]) {
        pathParams[k] = currentRoute.params[k] as string
      }
    })
  }

  return pathParams
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
