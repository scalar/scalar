import { type WorkspaceStore, createWorkspaceStore } from '@scalar/workspace-store/client'

/**
 * Everything the API reference needs from the store that renders its documents.
 *
 * The reference depends on this slice rather than on the whole workspace store, so a different store
 * implementation only has to provide these members. Reaching for anything outside it is a type error,
 * which keeps new code from quietly coupling the reference to the workspace store again.
 *
 * The API client modal keeps its own full workspace store and is not bound by this.
 */
export type ReferenceStore = Pick<
  WorkspaceStore,
  'workspace' | 'update' | 'addDocument' | 'exportWorkspace' | 'exportActiveDocument' | 'externalExamples'
>

/**
 * Creates the store that renders the API reference.
 *
 * This is the one place the reference store is constructed, so another implementation can be
 * swapped in here without touching the components that read from it.
 */
export const createReferenceStore = ({ verbose }: { verbose: boolean }): ReferenceStore =>
  createWorkspaceStore({ verbose })
