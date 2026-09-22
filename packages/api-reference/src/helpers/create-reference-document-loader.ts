import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getServers } from '@scalar/workspace-store/request-example'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'

import type { NormalizedConfiguration } from '@/helpers/normalize-configurations'
import { safeDeepClone } from '@/helpers/safe-deep-clone'

/** Shared document loading for SSR preparation, initial client loads, and configuration updates. */
export const createReferenceDocumentLoader = ({
  workspaceStore,
  clientStore,
  getConfigurations,
  getConfiguration,
}: {
  workspaceStore: WorkspaceStore
  clientStore: WorkspaceStore
  getConfigurations: () => Record<string, NormalizedConfiguration>
  getConfiguration: (configuration: NormalizedConfiguration) => ApiReferenceConfigurationRaw
}): {
  addDocument: WorkspaceStore['addDocument']
  ensureDocumentLoaded: (slug: string) => Promise<boolean>
  documentLoadPromises: Map<string, Promise<boolean>>
} => {
  const addDocument: typeof workspaceStore.addDocument = async (input, navigationOptions) => {
    const result = await workspaceStore.addDocument(input, navigationOptions)

    // The selected server lives only on the client store document. The user picks it in the
    // reference, it is never part of the imported source. Reloading the freshly imported document
    // below would drop it, so any config update that rebases the document — a new auth token,
    // reordered servers, an edited spec — would otherwise reset the server back to the first one.
    // Capture it here and re-apply it after the reload so the user's choice survives. See #5071.
    const previousDocument = clientStore.workspace.documents[input.name]
    const selectedServer =
      previousDocument && typeof previousDocument === 'object'
        ? (previousDocument as Record<string, unknown>)['x-scalar-selected-server']
        : undefined

    // Now add it to the client store
    const state = workspaceStore.exportWorkspace()
    const nextDocument = safeDeepClone(state.documents[input.name]) ?? {
      'openapi': '3.1.0',
      'info': {
        title: '',
        version: '',
      },
      'x-scalar-original-document-hash': '',
    }

    // Carry the user's server selection over to the reloaded document. An empty string is a
    // deliberate "no server selected" state, so it is preserved too; only `undefined` (a first
    // load with no prior selection) falls through to the default-server logic elsewhere.
    if (typeof selectedServer === 'string') {
      Object.assign(nextDocument, { 'x-scalar-selected-server': selectedServer })
    }

    clientStore.loadWorkspace({
      auth: {},
      documents: {
        [input.name]: nextDocument,
      },
      intermediateDocuments: {},
      originalDocuments: {},
      overrides: {},
      history: {},
      meta: {},
    })
    return result
  }

  // ---------------------------------------------------------------------------
  // Document Management

  /** In-flight document loads, so a background preload and a user selection never load the same document twice */
  const documentLoadPromises = new Map<string, Promise<boolean>>()

  /**
   * Load a document into the workspace store by slug, fetching URL sources or using inline content.
   *
   * This does not change the active document, so it is safe to call in the background to warm up
   * documents the user has not selected yet. Repeated calls are deduplicated and it becomes a no-op
   * once the document is loaded.
   */
  const ensureDocumentLoaded = (slug: string): Promise<boolean> => {
    // Already loaded, nothing to do
    if (workspaceStore.workspace.documents[slug]) {
      return Promise.resolve(true)
    }

    // A load is already in flight, reuse it
    const pending = documentLoadPromises.get(slug)
    if (pending) {
      return pending
    }

    const normalized = getConfigurations()[slug]

    if (!normalized) {
      return Promise.resolve(false)
    }

    const config = getConfiguration(normalized)

    const promise = (async () => {
      const result = await addDocument(
        normalized.source.url
          ? {
              name: slug,
              url: normalized.source.url,
              fetch: config.customFetch,
            }
          : {
              name: slug,
              document: normalized.source.content ?? {},
            },
        config,
      )

      const document = clientStore.workspace.documents[slug]

      // If the document does not have a selected server we set it to the first server
      if (result === true && isOpenApiDocument(document) && document['x-scalar-selected-server'] === undefined) {
        // Set the active server if the document is loaded successfully. Resolve relative servers
        // against this document's own base URL, not the active document's, so a background preload
        // does not derive its server from whichever document happens to be active.
        const servers = getServers(document.servers, {
          baseServerUrl: config.baseServerURL,
          documentUrl: normalized.source.url,
        })
        if (servers.length > 0) {
          clientStore.updateDocument(slug, 'x-scalar-selected-server', servers[0]!.url)
        }
      }

      // Seed the request body editor view from config, unless the document already sets it
      // explicitly via the `x-scalar-default-request-body-view` extension.
      if (
        result === true &&
        config.defaultRequestBodyView &&
        isOpenApiDocument(document) &&
        document['x-scalar-default-request-body-view'] === undefined
      ) {
        clientStore.updateDocument(slug, 'x-scalar-default-request-body-view', config.defaultRequestBodyView)
      }
      return result === true
    })().finally(() => {
      documentLoadPromises.delete(slug)
    })

    documentLoadPromises.set(slug, promise)

    return promise
  }

  return { addDocument, ensureDocumentLoaded, documentLoadPromises }
}
