import { reactive, toRaw } from 'vue'
import type { WorkspaceMeta, WorkspaceDocumentMeta, Workspace } from './schemas/server-workspace'
import { createMagicProxy } from './helpers/proxy'
import { isObject } from '@/helpers/general'
import { getValueByPath } from '@/helpers/json-path-utils'
import { bundle } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins-browser'

type WorkspaceDocumentMetaInput = { meta?: WorkspaceDocumentMeta; name: string }
type WorkspaceDocumentInput =
  | ({ document: Record<string, unknown> } & WorkspaceDocumentMetaInput)
  | ({ url: string } & WorkspaceDocumentMetaInput)

/**
 * Resolves a workspace document from various input sources (URL, local file, or direct document object).
 *
 * @param workspaceDocument - The document input to resolve, which can be:
 *   - A URL to fetch the document from
 *   - A local file path to read the document from
 *   - A direct document object
 * @returns A promise that resolves to an object containing:
 *   - ok: boolean indicating if the resolution was successful
 *   - data: The resolved document data
 *
 * @example
 * // Resolve from URL
 * const urlDoc = await loadDocument({ name: 'api', url: 'https://api.example.com/openapi.json' })
 *
 * // Resolve from local file
 * const fileDoc = await loadDocument({ name: 'local', path: './openapi.json' })
 *
 * // Resolve direct document
 * const directDoc = await loadDocument({
 *   name: 'inline',
 *   document: { openapi: '3.0.0', paths: {} }
 * })
 */
async function loadDocument(workspaceDocument: WorkspaceDocumentInput) {
  if ('url' in workspaceDocument) {
    return fetchUrls().exec(workspaceDocument.url)
  }

  return {
    ok: true as const,
    data: workspaceDocument.document,
  }
}

/**
 * Creates a reactive workspace store that manages documents and their metadata.
 * The store provides functionality for accessing, updating, and resolving document references.
 *
 * @param workspaceProps - Configuration object for the workspace
 * @param workspaceProps.meta - Optional metadata for the workspace
 * @param workspaceProps.documents - Optional record of documents to initialize the workspace with
 * @returns An object containing methods and getters for managing the workspace
 * @deprecated Use `createWorkspaceStore` instead.
 */
export function createWorkspaceStoreSync(workspaceProps?: {
  meta?: WorkspaceMeta
}) {
  // Create a reactive workspace object with proxied documents
  // Each document is wrapped in a proxy to enable reactive updates and reference resolution
  const workspace = reactive({
    ...workspaceProps?.meta,
    documents: {},
    /**
     * Returns the currently active document from the workspace.
     * The active document is determined by the 'x-scalar-active-document' metadata field,
     * falling back to the first document in the workspace if no active document is specified.
     *
     * @returns The active document or undefined if no document is found
     */
    get activeDocument(): (typeof workspace.documents)[number] | undefined {
      const activeDocumentKey = workspace['x-scalar-active-document'] ?? Object.keys(workspace.documents)[0] ?? ''
      return workspace.documents[activeDocumentKey]
    },
  }) as Workspace

  // Cache to track visited nodes during reference resolution to prevent bundling the same subtree multiple times
  // This is needed because we are doing partial bundle operations
  const visitedNodesCache = new Set()

  return {
    /**
     * Returns the raw (non-reactive) workspace object
     */
    get rawWorkspace() {
      return toRaw(workspace)
    },
    /**
     * Returns the reactive workspace object with an additional activeDocument getter
     */
    get workspace() {
      return workspace
    },
    /**
     * Updates a specific metadata field in the workspace
     * @param key - The metadata field to update
     * @param value - The new value for the field
     * @example
     * // Update the workspace title
     * update('x-scalar-active-document', 'document-name')
     */
    update<K extends keyof WorkspaceMeta>(key: K, value: WorkspaceMeta[K]) {
      // @ts-ignore
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        throw new Error('Invalid key: cannot modify prototype')
      }
      Object.assign(workspace, { [key]: value })
    },
    /**
     * Updates a specific metadata field in a document
     * @param name - The name of the document to update ('active' or a specific document name)
     * @param key - The metadata field to update
     * @param value - The new value for the field
     * @throws Error if the specified document doesn't exist
     * @example
     * // Update the auth of the active document
     * updateDocument('active', 'x-scalar-active-auth', 'Bearer')
     * // Update the auth of a specific document
     * updateDocument('document-name', 'x-scalar-active-auth', 'Bearer')
     */
    updateDocument<K extends keyof WorkspaceDocumentMeta>(
      name: 'active' | (string & {}),
      key: K,
      value: WorkspaceDocumentMeta[K],
    ) {
      const currentDocument =
        workspace.documents[
          name === 'active'
            ? (workspace['x-scalar-active-document'] ?? Object.keys(workspace.documents)[0] ?? '')
            : name
        ]

      if (!currentDocument) {
        throw 'Please select a valid document'
      }

      Object.assign(currentDocument, { [key]: value })
    },
    /**
     * Resolves a reference in the active document by following the provided path and resolving any external $ref references.
     * This method traverses the document structure following the given path and resolves any $ref references it encounters.
     * During resolution, it sets a loading status and updates the reference with the resolved content.
     *
     * @param path - Array of strings representing the path to the reference (e.g. ['paths', '/users', 'get', 'responses', '200'])
     * @throws Error if the path is invalid or empty
     * @example
     * // Resolve a reference in the active document
     * resolve(['paths', '/users', 'get', 'responses', '200'])
     */
    resolve: async (path: string[]) => {
      const activeDocument = workspace.activeDocument

      const target = getValueByPath(activeDocument, path)

      if (!isObject(target)) {
        console.error(
          `Invalid path provided for resolution. Path: [${path.join(', ')}]. Found value of type: ${typeof target}. Expected an object.`,
        )
        return
      }

      // Bundle the target document with the active document as root, resolving any external references
      // and tracking resolution status through hooks
      return bundle(target, {
        root: activeDocument,
        treeShake: false,
        plugins: [fetchUrls()],
        urlMap: false,
        hooks: {
          onResolveStart: (node) => {
            node['$status'] = 'loading'
          },
          onResolveError: (node) => {
            node['$status'] = 'error'
          },
        },
        visitedNodes: visitedNodesCache,
      })
    },
    /**
     * Adds a new document to the workspace
     * @param document - The document content to add. This should be a valid OpenAPI/Swagger document or other supported format
     * @param meta - Metadata for the document, including its name and other properties defined in WorkspaceDocumentMeta
     * @example
     * // Add a new OpenAPI document to the workspace
     * store.addDocument({
     *   name: 'name',
     *   document: {
     *     openapi: '3.0.0',
     *     info: { title: 'title' },
     *   },
     *   meta: {
     *     'x-scalar-active-auth': 'Bearer',
     *     'x-scalar-active-server': 'production'
     *   }
     * })
     */
    addDocument: async (input: WorkspaceDocumentInput) => {
      const { name, meta } = input

      const resolve = await loadDocument(input)

      if (!resolve.ok || !isObject(resolve.data)) {
        console.error(`Can not load the document '${name}'`)
        workspace.documents[name] = {
          ...meta,
        }
        return
      }

      workspace.documents[name] = createMagicProxy({ ...(resolve.data as Record<string, unknown>), ...meta })
    },
  }
}

/**
 * Creates a reactive workspace store that manages documents and their metadata.
 * The store provides functionality for accessing, updating, and resolving document references.
 *
 * @param workspaceProps - Configuration object for the workspace
 * @param workspaceProps.meta - Optional metadata for the workspace
 * @param workspaceProps.documents - Optional record of documents to initialize the workspace with
 * @returns An object containing methods and getters for managing the workspace
 * @example
 * // Create a workspace store with metadata and documents
 * const store = await createWorkspaceStore({
 *   meta: {
 *     name: 'My Workspace',
 *     description: 'A workspace for my API'
 *   },
 *   documents: [
 *     {
 *       name: 'petstore',
 *       document: {
 *         openapi: '3.0.0',
 *         info: { title: 'Petstore API' }
 *       }
 *     }
 *   ]
 * })
 */
export async function createWorkspaceStore(workspaceProps?: {
  meta?: WorkspaceMeta
  documents?: WorkspaceDocumentInput[]
}) {
  const store = createWorkspaceStoreSync({ meta: workspaceProps?.meta })

  await Promise.all(workspaceProps?.documents?.map((it) => store.addDocument(it)) ?? [])

  return store
}
