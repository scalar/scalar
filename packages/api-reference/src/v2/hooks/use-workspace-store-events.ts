import { REFERENCE_LS_KEYS, safeLocalStorage } from '@scalar/helpers/object/local-storage'
import { generateClientMutators, type WorkspaceStore } from '@scalar/workspace-store/client'
import { onCustomEvent } from '@scalar/workspace-store/events'
import type { Ref } from 'vue'

export const useWorkspaceStoreEvents = (store: WorkspaceStore, root: Ref<HTMLElement | null>) => {
  const mutators = generateClientMutators(store)

  //------------------------------------------------------------------------------------
  // TODO
  //------------------------------------------------------------------------------------
  // onCustomEvent(root, 'scalar-update-sidebar', (event) => {
  //   console.log('scalar-update-sidebar', event)
  // })

  //------------------------------------------------------------------------------------
  // Document Meta Related Event Handlers
  //------------------------------------------------------------------------------------
  onCustomEvent(root, 'scalar-update-dark-mode', (event) => {
    store.update('x-scalar-dark-mode', event.detail.value)
  })

  onCustomEvent(root, 'scalar-update-active-document', (event) => {
    store.update('x-scalar-active-document', event.detail.value)
  })

  //------------------------------------------------------------------------------------
  // Clients Related Event Handlers
  //------------------------------------------------------------------------------------
  onCustomEvent(root, 'scalar-update-selected-client', (event) => {
    store.update('x-scalar-default-client', event.detail)
    safeLocalStorage().setItem(REFERENCE_LS_KEYS.SELECTED_CLIENT, event.detail)
  })

  //------------------------------------------------------------------------------------
  // Server Related Event Handlers
  //------------------------------------------------------------------------------------
  onCustomEvent(root, 'scalar-replace-servers', (event) => {
    const activeDocument = store.workspace.activeDocument

    if (!activeDocument) {
      return
    }

    // Replace the servers in the active document
    activeDocument.servers = event.detail.servers

    // Set active server
    activeDocument['x-scalar-active-server'] = event.detail.servers.at(-1)?.url
  })

  onCustomEvent(root, 'scalar-update-selected-server', (event) => {
    const activeDocument = store.workspace.activeDocument

    if (activeDocument) {
      activeDocument['x-scalar-active-server'] = event.detail.value
    }
  })

  onCustomEvent(root, 'store-update-selected-server-properties', (event) => {
    const activeDocument = store.workspace.activeDocument

    if (!activeDocument) {
      return
    }

    const activeServer = activeDocument['servers']?.find((it) => it.url === activeDocument['x-scalar-active-server'])

    if (!activeServer) {
      return
    }

    // @ts-expect-error We know this will be the correct type
    activeServer[event.detail.key] = event.detail.value
  })

  onCustomEvent(root, 'scalar-update-selected-server-variables', (event) => {
    const activeDocument = store.workspace.activeDocument

    if (!activeDocument) {
      return
    }

    const activeServer = activeDocument['servers']?.find((it) => it.url === activeDocument['x-scalar-active-server'])

    if (!activeServer) {
      return
    }

    if (activeServer.variables?.[event.detail.key]) {
      activeServer.variables[event.detail.key].default = event.detail.value
    }
  })

  onCustomEvent(root, 'scalar-add-server', (event) => {
    mutators.active().serverMutators.addServer(event.detail.server)

    const activeDocument = store.workspace.activeDocument

    if (activeDocument) {
      activeDocument['x-scalar-active-server'] = event.detail.server.url
    }
  })

  onCustomEvent(root, 'scalar-delete-server', (event) => {
    mutators.active().serverMutators.deleteServer(event.detail.url)
  })
}
