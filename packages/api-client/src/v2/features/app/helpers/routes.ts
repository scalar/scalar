import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { mergeSearchParams } from '@scalar/helpers/url/merge-urls'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import type { RouteRecordRaw } from 'vue-router'

import type { MergedSecuritySchemes } from '@/v2/blocks/scalar-auth-selector-block/helpers/merge-security'
import Authentication from '@/v2/features/collection/components/Authentication.vue'
import Cookies from '@/v2/features/collection/components/Cookies.vue'
import Environment from '@/v2/features/collection/components/Environment.vue'
import Overview from '@/v2/features/collection/components/Overview.vue'
import Servers from '@/v2/features/collection/components/Servers.vue'
import Settings from '@/v2/features/collection/components/Settings.vue'
import DocumentCollection from '@/v2/features/collection/DocumentCollection.vue'
import WorkspaceCollection from '@/v2/features/collection/WorkspaceCollection.vue'
import Operation from '@/v2/features/operation/Operation.vue'
import type { ClientPlugin } from '@/v2/helpers/plugins'
import { workspaceStorage } from '@/v2/helpers/storage'
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
  securitySchemes: MergedSecuritySchemes
  workspaceStore: WorkspaceStore
  activeWorkspace: { id: string; label: string }
  plugins: ClientPlugin[]
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

export type ScalarClientAppRouteParams =
  | 'namespace'
  | 'workspaceSlug'
  | 'documentSlug'
  | 'pathEncoded'
  | 'method'
  | 'exampleName'

/** Routes for the API client app and web, the same as modal + workspace routes */
export const ROUTES = [
  {
    path: '/@:namespace/:workspaceSlug',
    children: [
      {
        path: ':documentSlug',
        children: [
          // Example page
          {
            name: 'example',
            path: 'path/:pathEncoded/method/:method/example/:exampleName',
            component: Operation,
          },
          // Document Page
          {
            name: 'document',
            path: '',
            component: DocumentCollection,
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
                component: Overview,
              },
              // Document servers
              {
                name: 'document.servers',
                path: 'servers',
                component: Servers,
              },
              // Document environment
              {
                name: 'document.environment',
                path: 'environment',
                component: Environment,
              },
              // Document authentication
              {
                name: 'document.authentication',
                path: 'authentication',
                component: Authentication,
              },
              // Document cookies
              {
                name: 'document.cookies',
                path: 'cookies',
                component: Cookies,
              },
              // Document settings
              {
                name: 'document.settings',
                path: 'settings',
                component: Settings,
              },
            ],
          },
        ],
      },
      // Workspace page
      {
        name: 'workspace',
        path: '',
        component: WorkspaceCollection,
        children: [
          // Workspace environment
          {
            name: 'workspace.environment',
            path: 'environment',
            component: Environment,
          },
          // Workspace cookies
          {
            name: 'workspace.cookies',
            path: 'cookies',
            component: Cookies,
          },
          // Workspace settings
          {
            name: 'workspace.settings',
            path: 'settings',
            component: Settings,
          },
        ],
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: () => {
      const DEFAULT_PATH = '/@local/local/drafts/overview'
      const lastPath = workspaceStorage.getLastPath() ?? DEFAULT_PATH

      // Set the default path to the last path so we don't go to an inifite loop if the last path is invalid
      workspaceStorage.setCurrentPath(DEFAULT_PATH)

      const url = new URL(lastPath, 'http://example.com')

      const queryParameters = new URLSearchParams(window.location.search)

      //Merge the query parameters with the last path
      const mergedSearchParams = mergeSearchParams(url.searchParams, queryParameters)

      // Preserve all query paramters
      return `${url.pathname}?${mergedSearchParams.toString()}`
    },
  },
] satisfies RouteRecordRaw[]
