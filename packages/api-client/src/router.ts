import { computed } from 'vue'
import {
  type RouteRecordRaw,
  createMemoryHistory,
  createRouter,
  createWebHistory,
} from 'vue-router'

export enum PathId {
  Request = 'request',
  Example = 'example',
  Cookies = 'cookies',
  Collection = 'collection',
  Schema = 'schema',
  Environment = 'environment',
  Server = 'server',
  Workspace = 'workspace',
}

/** Routes for the request section */
const requestRoutes = [
  {
    path: '',
    redirect: (to) => `${to.fullPath.replace(/\/$/, '')}/request/default`,
  },
  {
    path: 'request',
    redirect: 'request/default',
  },
  {
    name: PathId.Request,
    path: `request/:${PathId.Request}`,
    component: () => import('@/views/Request/Request.vue'),
  },
  {
    path: `request/:${PathId.Request}/example/:${PathId.Example}`,
    component: () => import('@/views/Request/Request.vue'),
  },
] satisfies RouteRecordRaw[]

/** Routes required by the client modal */
export const modalRoutes = [
  {
    path: '/',
    redirect: '/workspace/default/request/default',
  },
  {
    path: '/workspace',
    redirect: '/workspace/default/request/default',
  },
  /** This redirect is for the modal so its okay to go to default workspace as there should only be one */
  {
    path: `/request/:${PathId.Request}`,
    redirect: (to) => `/workspace/default/request/${to.params.request}`,
  },
  {
    path: `/workspace/:${PathId.Workspace}`,
    children: requestRoutes,
  },
] satisfies RouteRecordRaw[]

/** Routes for the client app */
const routes = [
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
    children: [
      ...requestRoutes,
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
    ],
  },
] satisfies RouteRecordRaw[]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

/** Creates the in memory router for the modal */
export const modalRouter = createRouter({
  history: createMemoryHistory(),
  routes: modalRoutes,
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
    [PathId.Workspace]: 'default',
  }

  // Snag current route from active router
  const currentRoute = modalRouter.currentRoute.value.matched.length
    ? modalRouter.currentRoute.value
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
