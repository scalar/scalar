import { getDocumentName } from '@/v2/blocks/helpers/get-document-name'
import {
  createWorkspaceStore,
  type ObjectDoc,
  type UrlDoc,
  type WorkspaceDocumentInput,
  type WorkspaceStore,
} from '@scalar/workspace-store/client'

/** Vue cannot handle unions in the props so we used partial + intersection here */
type DocumentInput = Partial<UrlDoc> & Partial<ObjectDoc>

export type GetWorkspaceStoreProps = {
  /** Pass in a store, otherwise we will create a singleton global one */
  store?: WorkspaceStore | undefined
} & DocumentInput

/** Global singleton store instance */
let store: WorkspaceStore | undefined

/** Lets us keep track of loading documents by name so we only load them once */
const documentMap = new Map<string, Promise<void>>()

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
export const getWorkspaceStore = (props: GetWorkspaceStoreProps): WorkspaceStore => {
  // We are on the server and we did not pass in a store
  if (typeof window === 'undefined' && !props.store) {
    throw new Error('[openapi-blocks] the store prop is required when using SSR/SSG')
  }

  const { store: storeProp, ...documentProps } = props
  const store = storeProp ?? createStore()

  const name = getDocumentName(documentProps, Object.keys(store.workspace.documents).length)
  // We need to re-cast the types due to the above note about vue and unions
  const addDocumentProps = { ...documentProps, name } as WorkspaceDocumentInput

  // Load up the document if we aren't already loading it
  if (!documentMap.has(name) && !store.workspace.documents[name]) {
    documentMap.set(name, store.addDocument(addDocumentProps))
  }

  return store
}
