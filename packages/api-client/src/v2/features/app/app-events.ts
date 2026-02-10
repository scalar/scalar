import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { OperationExampleMeta, WorkspaceEventBus } from '@scalar/workspace-store/events'
import { type ShallowRef, computed } from 'vue'
import type { Router } from 'vue-router'

import { initializeWorkspaceEventHandlers } from '@/v2/workspace-events'

export function initializeAppEventHandlers({
  eventBus,
  store,
  router,
  rebuildSidebar,
  navigateToCurrentTab,
  onSelectSidebarItem,
  onAfterExampleCreation,
  onCopyTabUrl,
  onToggleSidebar,
}: {
  eventBus: WorkspaceEventBus
  store: ShallowRef<WorkspaceStore | null>
  router: Router
  rebuildSidebar: (documentName?: string) => void
  navigateToCurrentTab: () => Promise<void>
  onSelectSidebarItem: (id: string) => void
  onAfterExampleCreation: (o: OperationExampleMeta) => void
  onCopyTabUrl: (tabIndex: number) => void
  onToggleSidebar: () => void
}) {
  const currentRoute = computed(() => router.currentRoute?.value)

  /**
   * Checks if the current route params match the specified operation meta.
   * Useful for determining if the sidebar or UI needs to be updated after changes to operations/examples.
   *
   * NOTE: It may be beneficial to compare to the active state instead of the router
   */
  const isRouteParamsMatch = ({
    documentName,
    path,
    method,
    exampleName,
  }: {
    documentName: string
    path?: string
    method?: HttpMethod
    exampleName?: string
  }) => {
    if (documentName !== undefined && documentName !== currentRoute.value?.params.documentSlug) {
      return false
    }
    if (path !== undefined && encodeURIComponent(path) !== currentRoute.value?.params.pathEncoded) {
      return false
    }
    if (method !== undefined && method !== currentRoute.value?.params.method) {
      return false
    }
    if (exampleName !== undefined && exampleName !== currentRoute.value?.params.exampleName) {
      return false
    }
    return true
  }

  initializeWorkspaceEventHandlers({
    eventBus,
    store,
    hooks: {
      //------------------------------------------------------------------------------------
      // Document Related Hooks
      //------------------------------------------------------------------------------------
      'document:delete:document': {
        onAfterExecute: async (payload) => {
          // Redirect to the workspace environment page if the document was deleted
          if (currentRoute?.value?.params.documentSlug === payload.name) {
            await router.push({
              name: 'workspace.environment',
            })
          }
        },
      },
      //------------------------------------------------------------------------------------
      // Operation Related Hooks
      //------------------------------------------------------------------------------------
      'operation:update:pathMethod': {
        onBeforeExecute: (payload) => ({
          ...payload,
          callback: async (status) => {
            // Redirect to the new example if the mutation was successful
            if (status === 'success') {
              await router.replace({
                name: 'example',
                params: {
                  method: payload.payload.method,
                  pathEncoded: encodeURIComponent(payload.payload.path),
                  exampleName: currentRoute.value?.params.exampleName,
                },
              })

              // Rebuild the sidebar with the updated order
              rebuildSidebar(store.value?.workspace.activeDocument?.['x-scalar-navigation']?.name)
            }
            payload.callback(status)
          },
        }),
      },
      'operation:upsert:parameter': {
        onAfterExecute: (payload) => onAfterExampleCreation(payload.meta),
      },
      'operation:update:extra-parameters': {
        onAfterExecute: (payload) => onAfterExampleCreation(payload.meta),
      },
      'operation:reload:history': {
        onAfterExecute: (payload) => onAfterExampleCreation({ ...payload.meta, exampleKey: 'draft' }),
      },

      'operation:delete:operation': {
        onAfterExecute: async (payload) => {
          rebuildSidebar(payload.documentName)
          const {
            documentName,
            meta: { path, method },
          } = payload
          // Navigate to the document overview page if the operation was deleted
          if (
            isRouteParamsMatch({
              documentName,
              path,
              method,
            })
          ) {
            await router.replace({
              name: 'document.overview',
              params: {
                documentSlug: documentName,
              },
            })
          }
        },
      },
      'operation:delete:example': {
        onAfterExecute: async (payload) => {
          rebuildSidebar(payload.documentName)

          const {
            documentName,
            meta: { path, method, exampleKey },
          } = payload
          // Navigate to the default example if the example was deleted
          if (
            isRouteParamsMatch({
              documentName,
              path,
              method,
              exampleName: exampleKey,
            })
          ) {
            await router.replace({
              name: 'example',
              params: {
                pathEncoded: encodeURIComponent(path),
                method,
                documentSlug: documentName,
                exampleName: 'default',
              },
            })
          }
        },
      },
      //------------------------------------------------------------------------------------
      // Operation Request Body Related Hooks
      //------------------------------------------------------------------------------------
      'operation:update:requestBody:value': {
        onAfterExecute: (payload) => onAfterExampleCreation(payload.meta),
      },
      'operation:update:requestBody:formValue': {
        onAfterExecute: (payload) => onAfterExampleCreation(payload.meta),
      },
      //------------------------------------------------------------------------------------
      // Tag Related Event Hooks
      //------------------------------------------------------------------------------------
      'tag:create:tag': {
        onAfterExecute: (payload) => rebuildSidebar(payload.documentName),
      },
      'tag:delete:tag': {
        onAfterExecute: (payload) => rebuildSidebar(payload.documentName),
      },
      //------------------------------------------------------------------------------------
      // Tabs Related Event Hooks
      //------------------------------------------------------------------------------------
      'tabs:add:tab': {
        onAfterExecute: navigateToCurrentTab,
      },
      'tabs:close:tab': {
        onAfterExecute: navigateToCurrentTab,
      },
      'tabs:focus:tab': {
        onAfterExecute: navigateToCurrentTab,
      },
      'tabs:focus:tab-last': {
        onAfterExecute: navigateToCurrentTab,
      },
      'tabs:navigate:previous': {
        onAfterExecute: navigateToCurrentTab,
      },
      'tabs:navigate:next': {
        onAfterExecute: navigateToCurrentTab,
      },
      'tabs:update:tabs': {
        onAfterExecute: navigateToCurrentTab,
      },
    },
  })

  //------------------------------------------------------------------------------------
  // Navigation Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('scroll-to:nav-item', ({ id }) => onSelectSidebarItem(id))

  //------------------------------------------------------------------------------------
  // UI Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('ui:toggle:sidebar', onToggleSidebar)
  eventBus.on('ui:route:page', ({ name }) => router.push({ name }))
  // Command palette handler is colocated with the command palette component

  eventBus.on('ui:route:example', async ({ exampleName, callback }) => {
    const result = await router.replace({
      name: 'example',
      params: {
        exampleName,
      },
    })
    callback(result ? 'error' : 'success')
  })

  //------------------------------------------------------------------------------------
  // Tabs Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('tabs:copy:url', (payload) => onCopyTabUrl(payload.index))
}
