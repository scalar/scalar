import { createWorkspaceStore, type WorkspaceDocumentInput, type WorkspaceStore } from '@scalar/workspace-store/client'

/** Takes in the input props for which either accept a store OR  */
type Props = {
  store?: WorkspaceStore | undefined
} & WorkspaceDocumentInput

/** Global singleton store instance */
let store: WorkspaceStore | undefined

/**
 * Creates or returns the existing singleton store instance.
 * This ensures we only create one store per application lifecycle.
 */
const createStore = (): WorkspaceStore => {
  store ||= createWorkspaceStore()
  return store
}

/**
 * Grabs either a store from the props or creates one and loads up the document
 *
 * Debate: currently we MUST pass in a store when on a server,
 * and its optional on a client since we can create a global one
 */
export const getStore = (props: Props): WorkspaceStore => {
  // We are on the server and we did not pass in a store
  if (typeof window === 'undefined' && !props.store) {
    throw new Error('[openapi-blocks] the store prop is required when using SSR/SSG')
  }

  const { store: storeProp, ...documentInput } = props
  const store = storeProp ?? createStore()

  // Load up the document if we don't have it
  if (!store.workspace.documents[documentInput.name]) {
    store.addDocument(documentInput)
  }

  return store
}
