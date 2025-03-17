import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'

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

/** Tracks the active workspace in localStorage for when the client reloads */
const ACTIVE_WORKSPACE_KEY = 'activeWorkspace' as const

/** Save the active workspace in localStorage for when the client reloads */
export function saveActiveWorkspace(to: RouteLocationNormalized) {
  const workspace = to.params[PathId.Workspace]

  if (workspace) {
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, `${workspace}`)
  }
}

/** Redirect to the saved workspace or the default workspace */
export function redirectToActiveWorkspace() {
  // Access localStorage
  const activeWorkspace = localStorage.getItem(ACTIVE_WORKSPACE_KEY)

  // Fallback
  if (!activeWorkspace) {
    return {
      name: 'workspace.default',
    }
  }

  // Redirect to active workspace
  return {
    name: 'request.root',
    params: {
      [PathId.Workspace]: activeWorkspace,
    },
  }
}

/** Shared request routes between modal and app */
const requestRoutes = [
  {
    name: 'request.root',
    path: '',
    component: () => import('@/views/Request/RequestRoot.vue'),
    redirect: (to) => ({
      name: 'request',
      params: { ...to.params, request: 'default' },
    }),
    children: [
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
      {
        name: 'collection',
        path: `collection/:${PathId.Collection}`,
        component: () => import('@/views/Collection/Collection.vue'),
        redirect: () => {
          return {
            name: 'collection.overview',
          }
        },
        children: [
          {
            name: 'collection.overview',
            path: 'overview',
            component: () => import('@/views/Collection/CollectionOverview.vue'),
          },
          {
            name: 'collection.servers',
            path: 'servers',
            component: () => import('@/views/Collection/CollectionServers.vue'),
            children: [
              {
                name: 'collection.servers.edit',
                path: `:${PathId.Servers}`,
                component: () => import('@/views/Collection/CollectionServers.vue'),
              },
            ],
          },
          {
            name: 'collection.environment',
            path: 'environment',
            component: () => import('@/views/Collection/CollectionEnvironment.vue'),
          },
          {
            name: 'collection.authentication',
            path: 'authentication',
            component: () => import('@/views/Collection/CollectionAuthentication.vue'),
          },
          {
            name: 'collection.cookies',
            path: 'cookies',
            component: () => import('@/views/Collection/CollectionCookies.vue'),
          },
          {
            name: 'collection.scripts',
            path: 'scripts',
            component: () => import('@/views/Collection/CollectionScripts.vue'),
          },
          {
            name: 'collection.sync',
            path: 'sync',
            component: () => import('@/views/Collection/CollectionSync.vue'),
          },
          {
            name: 'collection.settings',
            path: 'settings',
            component: () => import('@/views/Collection/CollectionSettings.vue'),
          },
        ],
      },
    ],
  },
] satisfies RouteRecordRaw[]

/** Routes required by the API client modal */
export const modalRoutes = [
  {
    name: 'root',
    path: '/',
    redirect: redirectToActiveWorkspace,
  },
  {
    name: 'workspace.default',
    path: '/workspace',
    redirect: {
      name: 'workspace',
      params: {
        [PathId.Workspace]: 'default',
      },
    },
  },
  {
    name: 'workspace',
    path: `/workspace/:${PathId.Workspace}`,
    redirect: {
      name: 'request.root',
    },
    children: requestRoutes,
  },
] satisfies RouteRecordRaw[]

/** Routes for the API client app */
export const routes = [
  {
    name: 'root',
    path: '/',
    redirect: redirectToActiveWorkspace,
  },
  {
    name: 'workspace.default',
    path: '/workspace',
    redirect: {
      name: 'request.root',
      params: {
        [PathId.Workspace]: 'default',
      },
    },
  },
  {
    name: 'workspace',
    path: `/workspace/:${PathId.Workspace}`,
    redirect: {
      name: 'request.root',
    },
    children: [
      ...requestRoutes,
      {
        name: 'environment.default',
        path: 'environment',
        redirect: (to) => ({
          name: 'environment',
          params: { ...to.params, [PathId.Environment]: 'default' },
        }),
      },
      {
        name: 'environment',
        path: `environment/:${PathId.Environment}`,
        component: () => import('@/views/Environment/Environment.vue'),
      },
      {
        name: 'environment.collection',
        path: `environment/:${PathId.Collection}/:${PathId.Environment}`,
        component: () => import('@/views/Environment/Environment.vue'),
        props: true,
      },
      {
        name: 'cookies.default',
        path: 'cookies',
        redirect: (to) => ({
          name: 'cookies',
          params: { ...to.params, [PathId.Cookies]: 'default' },
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
          params: {
            ...to.params,
            [PathId.Collection]: 'default',
            [PathId.Servers]: 'default',
          },
        }),
      },
      {
        name: 'settings.default',
        path: 'settings',
        redirect: (to) => ({
          name: 'settings',
          params: { ...to.params, [PathId.Settings]: 'general' },
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
