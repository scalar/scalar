import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { RouteRecordRaw } from 'vue-router'

import type { ClientLayout } from '@/v2/types/layout'

/** These props are provided at the route level */
export type RouteProps = {
  layout: ClientLayout
  workspaceStore: WorkspaceStore
  eventBus: WorkspaceEventBus
  // workspaceSlug: string
  // documentSlug?: string
  // pathEncoded?: string
  // method?: string
  // exampleName?: string
}

/** Routes for the API client app and web, the same as modal + workspace routes */
export const ROUTES = [
  // Global settings
  {
    name: 'settings',
    path: '/settings',
    component: () => import('@/v2/components/TempReplaceMe.vue'),
  },
  {
    name: 'workspace',
    path: '/workspace/:workspaceSlug',
    children: [
      // Workspace overview
      {
        name: 'workspace.overview',
        path: 'overview',
        component: () => import('@/v2/features/collection/Collection.vue'),
      },
      // Workspace servers
      {
        name: 'workspace.servers',
        path: 'servers',
        component: () => import('@/v2/components/TempReplaceMe.vue'),
      },
      // Workspace environment
      {
        name: 'workspace.environment',
        path: 'environment',
        component: () => import('@/v2/components/TempReplaceMe.vue'),
      },
      // Workspace authentication
      {
        name: 'workspace.authentication',
        path: 'authentication',
        component: () => import('@/v2/components/TempReplaceMe.vue'),
      },
      // Workspace cookies
      {
        name: 'workspace.cookies',
        path: 'cookies',
        component: () => import('@/v2/components/TempReplaceMe.vue'),
      },
      // Workspace settings
      {
        name: 'workspace.settings',
        path: 'settings',
        component: () => import('@/v2/components/TempReplaceMe.vue'),
      },
      // Example page
      {
        name: 'example',
        path: 'document/:documentSlug/path/:pathEncoded/method/:method/example/:exampleName',
        component: () => import('@/v2/components/TempReplaceMe.vue'),
      },
      // Document Page
      {
        name: 'document',
        path: 'document/:documentSlug',
        props: { type: 'document' },
        component: () => import('@/v2/features/collection/Collection.vue'),
        children: [
          // Redirect to overview
          {
            name: 'document.redirect',
            path: '',
            redirect: {
              name: 'document.overview',
            },
          },
          // Document overview
          {
            name: 'document.overview',
            path: 'overview',
            component: () => import('@/v2/features/collection/components/Overview.vue'),
          },
          // Document servers
          {
            name: 'document.servers',
            path: 'servers',
            component: () => import('@/v2/features/collection/components/Servers.vue'),
          },
          // Document environment
          {
            name: 'document.environment',
            path: 'environment',
            component: () => import('@/v2/features/collection/components/Environment.vue'),
          },
          // Document authentication
          {
            name: 'document.authentication',
            path: 'authentication',
            component: () => import('@/v2/features/collection/components/Authentication.vue'),
          },
          // Document cookies
          {
            name: 'document.cookies',
            path: 'cookies',
            component: () => import('@/v2/features/collection/components/Cookies.vue'),
          },
          // Document settings
          {
            name: 'document.settings',
            path: 'settings',
            component: () => import('@/v2/features/collection/components/Settings.vue'),
          },
        ],
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/workspace/default/document/default/overview',
  },
] satisfies RouteRecordRaw[]
