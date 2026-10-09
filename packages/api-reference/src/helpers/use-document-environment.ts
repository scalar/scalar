import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { watch } from 'vue'

/** Apply document environment defaults to an embedded store without replacing user selections. */
export const useDocumentEnvironment = (store: WorkspaceStore): void => {
  const selection = {
    applyingDefault: false,
    hasUserOverride: store.workspace['x-scalar-active-environment'] !== undefined,
  }

  // Remember user changes even when a later document happens to use the same default.
  watch(
    () => store.workspace['x-scalar-active-environment'],
    () => {
      if (!selection.applyingDefault) {
        selection.hasUserOverride = true
      }
    },
    { flush: 'sync' },
  )

  watch(
    () => {
      const document = store.workspace.activeDocument
      const environment = isOpenApiDocument(document)
        ? (document['x-scalar-active-environment'] ?? Object.keys(document['x-scalar-environments'] ?? {})[0])
        : undefined
      return [document, environment] as const
    },
    ([, environment]) => {
      if (selection.hasUserOverride) {
        return
      }
      selection.applyingDefault = true
      try {
        store.update('x-scalar-active-environment', environment)
      } finally {
        selection.applyingDefault = false
      }
    },
    { immediate: true, flush: 'sync' },
  )
}
