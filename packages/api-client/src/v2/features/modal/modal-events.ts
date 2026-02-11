import type { ModalState } from '@scalar/components'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'
import { type Ref, ref } from 'vue'

import type { UseModalSidebarReturn } from '@/v2/features/modal/hooks/use-modal-sidebar'
import { initializeWorkspaceEventHandlers } from '@/v2/workspace-events'

export function initializeModalEvents({
  eventBus,
  isSidebarOpen,
  sidebarState,
  modalState,
  store,
}: {
  eventBus: WorkspaceEventBus
  isSidebarOpen: Ref<boolean>
  sidebarState: UseModalSidebarReturn
  modalState: ModalState
  store: WorkspaceStore
}) {
  /** Initialize workspace event handlers */
  initializeWorkspaceEventHandlers({
    eventBus,
    store: ref(store),
    hooks: {},
  })

  //------------------------------------------------------------------------------------
  // Navigation Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('scroll-to:nav-item', ({ id }) => sidebarState.handleSelectItem(id))

  //------------------------------------------------------------------------------------
  // UI Related Event Handlers
  //------------------------------------------------------------------------------------
  eventBus.on('ui:toggle:sidebar', () => (isSidebarOpen.value = !isSidebarOpen.value))
  eventBus.on('ui:close:client-modal', () => modalState.hide())
  eventBus.on('ui:open:client-modal', (payload) => {
    // Just open the modal
    if (!payload) {
      modalState.show()
      return
    }

    // We route to the exact ID
    if ('id' in payload && payload.id) {
      let targetId = payload.id

      // If exampleName is provided, try to find the specific example entry
      if ('exampleName' in payload && payload.exampleName) {
        const operationEntry = sidebarState.state.getEntryById(payload.id)

        // Try to find the specific example in the operation's children
        if (operationEntry && 'children' in operationEntry && operationEntry.children) {
          const exampleEntry = operationEntry.children.find(
            (child: TraversedEntry) => child.type === 'example' && child.name === payload.exampleName,
          )
          if (exampleEntry) {
            targetId = exampleEntry.id
          }
        }
      }

      sidebarState.handleSelectItem(targetId)
    }
    // We must find the ID first from the entries
    else if ('method' in payload && 'path' in payload) {
      sidebarState.handleSelectItem(
        sidebarState.getEntryByLocation({
          document: store.workspace.activeDocument?.['x-scalar-navigation']?.id ?? '',
          path: payload.path,
          method: payload.method,
          example: payload.exampleName,
        })?.id ?? '',
      )
    }

    modalState.show()
  })
}
