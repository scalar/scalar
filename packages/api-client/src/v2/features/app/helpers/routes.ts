import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { RouteRecordRaw } from 'vue-router'

import type { ClientLayout } from '@/v2/types/layout'

/** These props are provided at the route level */
export type RouteProps = {
  layout: ClientLayout
  workspaceStore: WorkspaceStore
  // workspaceSlug: string
  // documentSlug?: string
  // pathEncoded?: string
  // method?: string
  // exampleName?: string
}

/** Routes for the API client app and web, the same as modal + workspace routes */
export const ROUTES = [
  {
    name: 'workspace',
    path: '/workspace/:workspaceSlug',
    children: [
      // Workspace overview
      {
        name: 'workspace.overview',
        path: 'overview',
        props: true,
        component: () => import('@/v2/components/TempReplaceMe.vue'),
      },
      // Workspace servers
      {
        name: 'workspace.servers',
        path: 'servers',
        props: true,
        component: () => import('@/v2/components/TempReplaceMe.vue'),
      },
      // Workspace environment
      {
        name: 'workspace.environment',
        path: 'environment',
        props: true,
        component: () => import('@/v2/components/TempReplaceMe.vue'),
      },
      // Workspace authentication
      {
        name: 'workspace.authentication',
        path: 'authentication',
        props: true,
        component: () => import('@/v2/components/TempReplaceMe.vue'),
      },
      // Workspace cookies
      {
        name: 'workspace.cookies',
        path: 'cookies',
        props: true,
        component: () => import('@/v2/components/TempReplaceMe.vue'),
      },
      // Workspace settings
      {
        name: 'workspace.settings',
        path: 'settings',
        props: true,
        component: () => import('@/v2/components/TempReplaceMe.vue'),
      },
      // Document
      {
        name: 'document',
        path: 'document/:documentSlug',
        children: [
          // Document overview
          {
            name: 'document.overview',
            path: 'overview',
            props: true,
            component: () => import('@/v2/components/TempReplaceMe.vue'),
          },
          // Document servers
          {
            name: 'document.servers',
            path: 'servers',
            props: true,
            component: () => import('@/v2/components/TempReplaceMe.vue'),
          },
          // Document environment
          {
            name: 'document.environment',
            path: 'environment',
            props: true,
            component: () => import('@/v2/components/TempReplaceMe.vue'),
          },
          // Document authentication
          {
            name: 'document.authentication',
            path: 'authentication',
            props: true,
            component: () => import('@/v2/components/TempReplaceMe.vue'),
          },
          // Document cookies
          {
            name: 'document.cookies',
            path: 'cookies',
            props: true,
            component: () => import('@/v2/components/TempReplaceMe.vue'),
          },
          // Document settings
          {
            name: 'document.settings',
            path: 'settings',
            props: true,
            component: () => import('@/v2/components/TempReplaceMe.vue'),
          },
          // Example page
          {
            name: 'example',
            path: 'path/:pathEncoded/method/:method/example/:exampleName',
            props: true,
            component: () => import('@/v2/components/TempReplaceMe.vue'),
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
