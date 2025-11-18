import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import type { RouteRecordRaw } from 'vue-router'

import { workspaceStorage } from '@/v2/helpers/storage'
import type { Workspace } from '@/v2/hooks/use-workspace-selector'
import type { ClientLayout } from '@/v2/types/layout'

/** These props are provided at the route level */
export type RouteProps = {
  documentSlug: string
  document: WorkspaceDocument | null
  eventBus: WorkspaceEventBus
  layout: ClientLayout
  path?: string
  method?: HttpMethod
  exampleName?: string
  environment: XScalarEnvironment
  workspaceStore: WorkspaceStore
  activeWorkspace: Workspace
  // workspaceSlug: string
  // documentSlug?: string
}

/** When in the collections pages */
export type CollectionProps = RouteProps &
  (
    | {
        collectionType: 'document'
        document: WorkspaceDocument
      }
    | {
        collectionType: 'workspace'
        document: null
      }
  )

/** Routes for the API client app and web, the same as modal + workspace routes */
export const ROUTES = [
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
            component: () => import('@/v2/features/operation/Operation.vue'),
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
    redirect: () => `/workspace/${workspaceStorage.getActiveWorkspaceId() ?? 'default'}/document/drafts/overview`,
  },
] satisfies RouteRecordRaw[]
