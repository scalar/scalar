import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { createWorkspaceStore, type ObjectDoc, type UrlDoc, type WorkspaceStore } from '@scalar/workspace-store/client'

export type GetStoreProps = {
  /** Pass in a store, otherwise we will create a singleton global one */
  store?: WorkspaceStore | undefined
} /** Vue cannot handle unions in the props so we used an intersection here */ & Partial<UrlDoc> &
  Partial<ObjectDoc>

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

/** Calculate a default name for the document to make the workspace store name parameter optional */
const getDocumentName = (
  { name, url, document }: Partial<UrlDoc> & Partial<ObjectDoc> = {},
  numOfDocuments: number,
): string => {
  // Check for explicit name first (highest priority)
  if (name) {
    return name
  }

  // Check for URL-based document
  if (url) {
    return url
  }

  // Check for OpenAPI info title
  if (document?.info) {
    const info = document.info as OpenAPIV3_1.InfoObject
    if (info.title) {
      return info.title
    }
  }

  return `OpenApi Document ${numOfDocuments + 1}`
}

/**
 * Grabs either a store from the props or creates one and loads up the document
 *
 * Debate: currently we MUST pass in a store when on a server,
 * and its optional on a client since we can create a global one
 */
export const getStore = (props: GetStoreProps): WorkspaceStore => {
  // We are on the server and we did not pass in a store
  if (typeof window === 'undefined' && !props.store) {
    throw new Error('[openapi-blocks] the store prop is required when using SSR/SSG')
  }

  const { store: storeProp, ...documentProps } = props
  const store = storeProp ?? createStore()

  /** Sort out the name automatically if we need to */
  const name = getDocumentName(documentProps, Object.keys(store.workspace.documents).length)

  // Load up the document if we aren't already loading it
  if (!documentMap.has(name)) {
    documentMap.set(
      name,
      store.addDocument(
        // We need to re-cast the types due to the above note about vue and unions
        'document' in documentProps && documentProps.document
          ? (documentProps as ObjectDoc)
          : (documentProps as UrlDoc),
      ),
    )
  }

  return store
}
