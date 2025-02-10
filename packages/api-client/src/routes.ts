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
    name: 'request.default',
    params: {
      workspace: activeWorkspace,
    },
  }
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
    redirect: redirectToActiveWorkspace,
  },
  {
    name: 'workspace.default',
    path: '/workspace',
    redirect: {
      name: 'workspace',
      params: {
        workspace: 'default',
      },
    },
  },
  {
    name: 'workspace',
    path: `/workspace/:${PathId.Workspace}`,
    redirect: {
      name: 'request.default',
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
      name: 'request.default',
      params: {
        workspace: 'default',
      },
    },
  },
  {
    name: 'workspace',
    path: `/workspace/:${PathId.Workspace}`,
    redirect: {
      name: 'request.default',
    },
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
        name: 'environment.collection',
        path: 'environment/:collectionId/:environmentId',
        component: () => import('@/views/Environment/Environment.vue'),
        props: true,
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
          params: {
            ...to.params,
            collectionId: 'default',
            servers: 'default',
          },
        }),
      },
      {
        name: 'servers',
        path: `servers/:collectionId/:${PathId.Servers}`,
        component: () => import('@/views/Servers/Servers.vue'),
        props: true,
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
