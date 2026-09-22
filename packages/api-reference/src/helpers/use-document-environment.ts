import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { isReactive, onScopeDispose, watch } from 'vue'

/**
 * Apply document environment defaults to an embedded store without replacing user selections.
 * Non-reactive stores run the same synchronization at their mutation boundaries.
 */
export const useDocumentEnvironment = (store: WorkspaceStore): void => {
  const selection = {
    applyingDefault: false,
    previous: store.workspace['x-scalar-active-environment'],
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

  const getSelection = (): readonly [WorkspaceStore['workspace']['activeDocument'], string | undefined] => {
    const document = store.workspace.activeDocument
    const environment = isOpenApiDocument(document)
      ? (document['x-scalar-active-environment'] ?? Object.keys(document['x-scalar-environments'] ?? {})[0])
      : undefined
    return [document, environment] as const
  }
  const sync = ([, environment]: ReturnType<typeof getSelection>): void => {
    if (selection.hasUserOverride) {
      return
    }
    selection.applyingDefault = true
    try {
      store.update('x-scalar-active-environment', environment)
    } finally {
      selection.applyingDefault = false
    }
  }
  const synchronize = (): void => {
    // Plain stores have no watcher to remember explicit environment choices.
    if (store.workspace['x-scalar-active-environment'] !== selection.previous) {
      selection.hasUserOverride = true
    }
    sync(getSelection())
    selection.previous = store.workspace['x-scalar-active-environment']
  }
  if (!isReactive(store.workspace)) {
    onScopeDispose(store.onSynchronize(synchronize))
  }
  watch(getSelection, synchronize, { immediate: true, flush: 'sync' })
}
