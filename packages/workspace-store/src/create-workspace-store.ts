import { reactive, toRaw } from 'vue'
import type { WorkspaceMeta, Workspace, WorkspaceDocumentMeta } from './schemas/server-workspace'
import { isObject } from '@scalar/openapi-parser'
import { createMagicProxy } from './helpers/proxy'
import { resolveRef } from '@/helpers/general'

/**
 * Creates a reactive workspace store that manages documents and their metadata.
 * The store provides functionality for accessing, updating, and resolving document references.
 *
 * @param workspaceProps - Configuration object for the workspace
 * @param workspaceProps.meta - Optional metadata for the workspace
 * @param workspaceProps.documents - Optional record of documents to initialize the workspace with
 * @returns An object containing methods and getters for managing the workspace
 */
export function createWorkspaceStore(workspaceProps?: {
  meta?: WorkspaceMeta
  documents?: Record<string, Record<string, unknown>>
}) {
  // Create a reactive workspace object with proxied documents
  // Each document is wrapped in a proxy to enable reactive updates and reference resolution
  const workspace = reactive({
    ...workspaceProps?.meta,
    documents: Object.fromEntries(
      Object.entries(workspaceProps?.documents || {}).map(([key, doc]) => [key, createMagicProxy(doc)]),
    ),
  }) as Workspace

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
      return {
        ...workspace,
        get activeDocument(): (typeof workspace.documents)[number] | undefined {
          const activeDocumentKey = workspaceProps?.meta?.['x-scalar-active-document'] ?? ''
          return workspace.documents[activeDocumentKey]
        },
      }
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
        workspace.documents[name === 'active' ? (workspace['x-scalar-active-document'] ?? '') : name]

      if (!currentDocument) {
        throw 'Please select a valid document'
      }

      Object.assign(currentDocument, { [key]: value })
    },
    /**
     * Resolves a reference in the active document by following the provided path and resolving any external $ref references
     * @param path - Array of strings representing the path to the reference (e.g. ['paths', '/users', 'get', 'responses', '200'])
     * @throws Error if the path is invalid or empty
     * @example
     * // Resolve a reference in the active document
     * resolve(['paths', '/users', 'get', 'responses', '200'])
     */
    resolve: async (path: string[]) => {
      if (path.length <= 1) {
        throw 'Please provide a valid path'
      }

      const activeDocument =
        workspace.documents[workspace['x-scalar-active-document'] ?? Object.keys(workspace.documents)[0] ?? '']

      let target = activeDocument as Record<string, any>

      for (const p of path) {
        target = target[p]
      }

      if (isObject(target) && '$ref' in target) {
        // Clear all current properties
        Object.keys(target).forEach((key) => {
          delete target[key]
        })

        const ref = target['$ref']

        // Set the status to loading while we resolve the ref
        Object.assign(target, { status: 'loading' })

        const result = await resolveRef(ref)

        if (result.ok) {
          Object.assign(target, result.data)
        } else {
          Object.assign(target, { status: 'error' })
        }
      }
    },
    /**
     * Adds a new document to the workspace
     * @param document - The document content to add. This should be a valid OpenAPI/Swagger document or other supported format
     * @param meta - Metadata for the document, including its name and other properties defined in WorkspaceDocumentMeta
     * @throws Error if a document with the same name already exists
     * @example
     * // Add a new OpenAPI document
     * addDocument({
     *   openapi: '3.0.0',
     *   info: { title: 'My API' }
     * }, { name: 'api' })
     */
    addDocument: (document: Record<string, unknown>, meta: { name: string } & WorkspaceDocumentMeta) => {
      const { name, ...documentMeta } = meta

      workspace.documents[name] = createMagicProxy({ ...document, ...documentMeta })
    },
  }
}
