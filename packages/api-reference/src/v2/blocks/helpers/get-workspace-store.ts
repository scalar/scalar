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
 * Splits the props back into a proper document input type to avoid the vue issue + type cast
 */
const getDocumentInput = (props: GetWorkspaceStoreProps, name: string): WorkspaceDocumentInput => {
  const { url, fetch, document, store: _, ...rest } = props

  if (url) {
    return { ...rest, url, fetch, name }
  }

  if (document) {
    return { ...rest, document, name }
  }

  throw new Error('[openapi-blocks] no document or url provided')
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

  const store = props.store ?? createStore()
  const name = getDocumentName(props, Object.keys(store.workspace.documents).length)
  const hasDocument = props.url || props.document

  // Load up the document if we aren't already loading it
  if (!documentMap.has(name) && !store.workspace.documents[name] && hasDocument) {
    documentMap.set(name, store.addDocument(getDocumentInput(props, name)))
  }

  return store
}
