import { isClient } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { XScalarSelectedSecurity } from '@scalar/workspace-store/schemas/extensions/security/x-scalar-selected-security'

import { authStorage, clientStorage } from '@/helpers/storage'

export const loadClientFromStorage = (store: WorkspaceStore) => {
  const storedClient = clientStorage().get()
  if (isClient(storedClient) && !store.workspace['x-scalar-default-client']) {
    store.update('x-scalar-default-client', storedClient)
  }
}

export const loadAuthSchemesFromStorage = (store: WorkspaceStore) => {
  console.log('loadAuthSchemesFromStorage', store.workspace)
  const slug = store.workspace['x-scalar-active-document'] ?? ''
  if (!slug) {
    console.warn('No active document found, skipping auth schemes loading')
    return
  }
  const authPersistence = authStorage()
  const storedAuthSchemes = authPersistence.getSchemas(slug)
  const storedSelectedAuthSchemes = authPersistence.getSelectedSchemes(slug)['x-scalar-selected-security']

  console.log('storedSelectedAuthSchemes', storedSelectedAuthSchemes)

  const availableAuthSchemes = new Set(Object.keys(store.workspace.documents[slug]?.components?.securitySchemes ?? {}))

  const isSchemeValid = (
    scheme: NonNullable<XScalarSelectedSecurity['x-scalar-selected-security']>['selectedSchemes'][number],
  ) => {
    return Object.keys(scheme).every((key) => availableAuthSchemes.has(key))
  }

  const activeDocument = store.workspace.activeDocument

  if (!activeDocument) {
    console.warn('No active document found, skipping auth schemes loading')
    return
  }

  if (storedAuthSchemes && storedSelectedAuthSchemes) {
    if (!activeDocument['x-scalar-selected-security']) {
      activeDocument['x-scalar-selected-security'] = {
        selectedIndex: 0,
        selectedSchemes: [],
      }

      // Restore the selected index and schemes
      activeDocument['x-scalar-selected-security'].selectedIndex = storedSelectedAuthSchemes.selectedIndex
      activeDocument['x-scalar-selected-security'].selectedSchemes =
        storedSelectedAuthSchemes.selectedSchemes.filter(isSchemeValid)

      console.log('filtered', storedSelectedAuthSchemes.selectedSchemes.filter(isSchemeValid))
    }

    // TODO: restore the auth secrets
  }
}
