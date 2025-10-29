import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import type { RouteRecordRaw } from 'vue-router'

import type { ClientLayout } from '@/v2/types/layout'

/** These props are provided at the route level */
export type RouteProps = {
  document: WorkspaceDocument | null
  eventBus: WorkspaceEventBus
  layout: ClientLayout
  environment: XScalarEnvironment
  workspaceStore: WorkspaceStore
  // workspaceSlug: string
  // documentSlug?: string
  // pathEncoded?: string
  // method?: string
  // exampleName?: string
}

/** When in the document collections route */
export type CollectionPropsDocument = RouteProps & {
  type: 'document'
  document: WorkspaceDocument
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
    path: '/workspace/:workspaceSlug',
    children: [
      {
        path: 'document/:documentSlug',
        children: [
          // Example page
          {
            name: 'example',
            path: 'path/:pathEncoded/method/:method/example/:exampleName',
            component: () => import('@/v2/components/TempReplaceMe.vue'),
          },
          // Document Page
          {
            name: 'document',
            path: '',
            component: () => import('@/v2/features/collection/DocumentCollection.vue'),
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
      // Workspace page
      {
        name: 'workspace',
        path: '',
        component: () => import('@/v2/features/collection/WorkspaceCollection.vue'),
        children: [
          // Workspace overview
          {
            name: 'workspace.overview',
            path: 'overview',
            component: () => import('@/v2/features/collection/WorkspaceCollection.vue'),
          },
          // Workspace environment
          {
            name: 'workspace.environment',
            path: 'environment',
            component: () => import('@/v2/features/collection/components/Environment.vue'),
          },
          // Workspace cookies
          {
            name: 'workspace.cookies',
            path: 'cookies',
            component: () => import('@/v2/features/collection/components/Cookies.vue'),
          },
          // Workspace settings
          {
            name: 'workspace.settings',
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
