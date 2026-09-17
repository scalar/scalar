import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { watch } from 'vue'

/** Apply document environment defaults to an embedded store without replacing user selections. */
export const useDocumentEnvironment = (store: WorkspaceStore): void => {
  watch(
    () => {
      const document = store.workspace.activeDocument
      const environment = isOpenApiDocument(document)
        ? (document['x-scalar-active-environment'] ?? Object.keys(document['x-scalar-environments'] ?? {})[0])
        : undefined
      return [document, environment] as const
    },
    ([, environment], previous) => {
      const previousEnvironment = previous?.[1]
      // A different selection, including clearing the environment, belongs to the user.
      if (store.workspace['x-scalar-active-environment'] !== previousEnvironment) {
        return
      }
      store.update('x-scalar-active-environment', environment)
    },
    { immediate: true, flush: 'sync' },
  )
}
