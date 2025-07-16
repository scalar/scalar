import { bundle, upgrade } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins-browser'
import { reactive, toRaw } from 'vue'
import YAML from 'yaml'

import { applySelectiveUpdates } from '@/helpers/apply-selective-updates'
import { deepClone, isObject, safeAssign } from '@/helpers/general'
import { getValueByPath } from '@/helpers/json-path-utils'
import { mergeObjects } from '@/helpers/merge-object'
import { createMagicProxy, getRaw } from '@/helpers/proxy'
import { createNavigation, type createNavigationOptions } from '@/navigation'
import { extensions } from '@/schemas/extensions'
import { type InMemoryWorkspace, InMemoryWorkspaceSchema } from '@/schemas/inmemory-workspace'
import { defaultReferenceConfig } from '@/schemas/reference-config'
import { coerceValue } from '@/schemas/typebox-coerce'
import { OpenAPIDocumentSchema } from '@/schemas/v3.1/strict/openapi-document'
import type { Workspace, WorkspaceDocumentMeta, WorkspaceMeta } from '@/schemas/workspace'
import type { Config } from '@/schemas/workspace-specification/config'
import type { DeepTransform } from '@/types'

/**
 * Input type for workspace document metadata and configuration.
 * This type defines the required and optional fields for initializing a document in the workspace.
 *
 * TODO: merge navigation options with the document config
 */
type WorkspaceDocumentMetaInput = {
  /** Optional metadata about the document like title, description, etc */
  meta?: WorkspaceDocumentMeta
  /** Required unique identifier for the document */
  name: string
  /** Optional configuration for generating navigation structure */
  config?: Config & Partial<createNavigationOptions>
}

/**
 * Represents a document that is loaded from a URL.
 * This type extends WorkspaceDocumentMetaInput to include URL-specific properties.
 */
export type UrlDoc = {
  /** URL to fetch the OpenAPI document from */
  url: string
  /** Optional custom fetch implementation to use when retrieving the document. By default the global fetch implementation will be used */
  fetch?: (input: string | URL | globalThis.Request, init?: RequestInit) => Promise<Response>
} & WorkspaceDocumentMetaInput

/** Represents a document that is provided directly as an object rather than loaded from a URL */
export type ObjectDoc = {
  /** The OpenAPI document object containing the API specification */
  document: Record<string, unknown>
} & WorkspaceDocumentMetaInput

/**
 * Union type representing the possible input formats for a workspace document:
 * - UrlDoc: Document loaded from a URL with optional fetch configuration
 * - ObjectDoc: Direct document object with metadata
 */
export type WorkspaceDocumentInput = UrlDoc | ObjectDoc

const defaultConfig: DeepTransform<Config, 'NonNullable'> = {
  'x-scalar-reference-config': defaultReferenceConfig,
}

/**
 * Resolves a workspace document from various input sources (URL, local file, or direct document object).
 *
 * @param workspaceDocument - The document input to resolve, which can be:
 *   - A URL to fetch the document from
 *   - A direct document object
 * @returns A promise that resolves to an object containing:
 *   - ok: boolean indicating if the resolution was successful
 *   - data: The resolved document data
 *
 * @example
 * // Resolve from URL
 * const urlDoc = await loadDocument({ name: 'api', url: 'https://api.example.com/openapi.json' })
 *
 * // Resolve direct document
 * const directDoc = await loadDocument({
 *   name: 'inline',
 *   document: { openapi: '3.0.0', paths: {} }
 * })
 */
async function loadDocument(workspaceDocument: WorkspaceDocumentInput) {
  if ('url' in workspaceDocument) {
    return fetchUrls({ fetch: workspaceDocument.fetch }).exec(workspaceDocument.url)
  }

  return {
    ok: true as const,
    data: workspaceDocument.document,
  }
}

/**
 * Configuration object for initializing a workspace store.
 * Defines the initial state and documents for the workspace.
 */
type WorkspaceProps = {
  /** Optional metadata for the workspace including theme, active document, etc */
  meta?: WorkspaceMeta
  /** In-mem open api documents. Async source documents (like URLs) can be loaded after initialization */
  documents?: ObjectDoc[]
  /** Workspace configuration */
  config?: Config
}

/**
 * Type definition for the workspace store return object.
 * This explicit type is needed to avoid TypeScript inference limits.
 *
 * @see https://github.com/microsoft/TypeScript/issues/43817#issuecomment-827746462
 */
export type WorkspaceStore = {
  /** Returns the reactive workspace object with an additional activeDocument getter */
  readonly workspace: Workspace
  /** Updates a specific metadata field in the workspace */
  update<K extends keyof WorkspaceMeta>(key: K, value: WorkspaceMeta[K]): void
  /** Updates a specific metadata field in a document */
  updateDocument<K extends keyof WorkspaceDocumentMeta>(
    name: 'active' | (string & {}),
    key: K,
    value: WorkspaceDocumentMeta[K],
  ): void
  /** Resolves a reference in the active document by following the provided path and resolving any external $ref references */
  resolve(path: string[]): Promise<unknown>
  /** Adds a new document to the workspace */
  addDocument(input: WorkspaceDocumentInput): Promise<void>
  /** Similar to addDocument but requires and in-mem object to be provided and loads the document synchronously */
  addDocumentSync(input: ObjectDoc): void
  /** Returns the merged configuration for the active document */
  readonly config: typeof defaultConfig
  /** Downloads the specified document in the requested format */
  exportDocument(documentName: string, format: 'json' | 'yaml'): string | undefined
  /** Persists the current state of the specified document back to the original documents map */
  saveDocument(documentName: string): unknown[] | undefined
  /** Reverts the specified document to its original state */
  revertDocumentChanges(documentName: string): void
  /** Commits the specified document */
  commitDocument(documentName: string): void
  /** Serializes the current workspace state to a JSON string for backup, persistence, or sharing. */
  exportWorkspace(): string
  /** Imports a workspace from a serialized JSON string. */
  loadWorkspace(input: string): void
}

/**
 * Creates a reactive workspace store that manages documents and their metadata.
 * The store provides functionality for accessing, updating, and resolving document references.
 *
 * @param workspaceProps - Configuration object for the workspace
 * @param workspaceProps.meta - Optional metadata for the workspace
 * @param workspaceProps.documents - Optional record of documents to initialize the workspace with
 *  Documents that require asynchronous loading must be added using `addDocument` after the store is created
 *  this allows atomic awaiting and does not block page load for the store initialization
 * @returns An object containing methods and getters for managing the workspace
 */
export const createWorkspaceStore = (workspaceProps?: WorkspaceProps): WorkspaceStore => {
  /**
   * Holds the original, unmodified documents as they were initially loaded into the workspace.
   * These documents are stored in their raw form—prior to any reactive wrapping, dereferencing, or bundling.
   * This map preserves the pristine structure of each document, using deep clones to ensure that
   * subsequent mutations in the workspace do not affect the originals.
   * The originals are retained so that we can restore, compare, or sync with the remote registry as needed.
   */
  const originalDocuments = {} as Workspace['documents']

  /**
   * Stores the intermediate state of documents after local edits but before syncing with the remote registry.
   *
   * This map acts as a local "saved" version of the document, reflecting the user's changes after they hit "save".
   * The `originalDocuments` map, by contrast, always mirrors the document as it exists in the remote registry.
   *
   * Use this map to stage local changes that are ready to be propagated back to the remote registry.
   * This separation allows us to distinguish between:
   *   - The last known remote version (`originalDocuments`)
   *   - The latest locally saved version (`intermediateDocuments`)
   *   - The current in-memory (possibly unsaved) workspace document (`workspace.documents`)
   */
  const intermediateDocuments = {} as Workspace['documents']
  /**
   * A map of document configurations keyed by document name.
   * This stores the configuration options for each document in the workspace,
   * allowing for document-specific settings like navigation options, appearance,
   * and other reference configuration.
   */
  const documentConfigs: Record<string, Config> = {}

  // Create a reactive workspace object with proxied documents
  // Each document is wrapped in a proxy to enable reactive updates and reference resolution
  const workspace = reactive<Workspace>({
    ...workspaceProps?.meta,
    documents: {},
    /**
     * Returns the currently active document from the workspace.
     * The active document is determined by the 'x-scalar-active-document' metadata field,
     * falling back to the first document in the workspace if no active document is specified.
     *
     * @returns The active document or undefined if no document is found
     */
    get activeDocument(): NonNullable<Workspace['activeDocument']> | undefined {
      const activeDocumentKey =
        workspace[extensions.workspace.activeDocument] ?? Object.keys(workspace.documents)[0] ?? ''
      return workspace.documents[activeDocumentKey]
    },
  })

  /**
   * Returns the name of the currently active document in the workspace.
   * The active document is determined by the 'x-scalar-active-document' metadata field,
   * falling back to the first document in the workspace if no active document is specified.
   *
   * @returns The name of the active document or an empty string if no document is found
   */
  function getActiveDocumentName() {
    return workspace[extensions.workspace.activeDocument] ?? Object.keys(workspace.documents)[0] ?? ''
  }

  // Add a document to the store synchronously from an in-memory OpenAPI document
  function addDocumentSync(input: ObjectDoc) {
    const { name, meta } = input

    const document = coerceValue(OpenAPIDocumentSchema, upgrade(input.document).specification)

    // Store the original document in the originalDocuments map
    // This is used to track the original state of the document as it was loaded into the workspace
    originalDocuments[name] = deepClone({ ...document, ...meta })
    // Store the intermediate document state for local edits
    // This is used to track the last saved state of the document
    // It allows us to differentiate between the original document and the latest saved version
    // This is important for local edits that are not yet synced with the remote registry
    // The intermediate document is used to store the latest saved state of the document
    // This allows us to track changes and revert to the last saved state if needed
    intermediateDocuments[name] = deepClone({ ...document, ...meta })
    // Add the document config to the documentConfigs map
    documentConfigs[name] = input.config ?? {}

    // Skip navigation generation if the document already has a server-side generated navigation structure
    if (document[extensions.document.navigation] === undefined) {
      document[extensions.document.navigation] = createNavigation(document, input.config ?? {}).entries
    }

    workspace.documents[name] = createMagicProxy({ ...document, ...meta })
  }

  // Add any initial documents to the store
  workspaceProps?.documents?.forEach(addDocumentSync)

  // Cache to track visited nodes during reference resolution to prevent bundling the same subtree multiple times
  // This is needed because we are doing partial bundle operations
  const visitedNodesCache = new Set()

  return {
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
      const currentDocument = workspace.documents[name === 'active' ? getActiveDocumentName() : name]

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
      const { name, meta, config } = input

      const resolve = await loadDocument(input)

      if (!resolve.ok) {
        console.error(`Failed to fetch document '${name}': request was not successful`)

        workspace.documents[name] = {
          ...meta,
          openapi: '3.1.0',
          info: {
            title: `Document '${name}' could not be loaded`,
            version: 'unknown',
          },
        }

        return
      }

      if (!isObject(resolve.data)) {
        console.error(`Failed to load document '${name}': response data is not a valid object`)

        workspace.documents[name] = {
          ...meta,
          openapi: '3.1.0',
          info: {
            title: `Document '${name}' could not be loaded`,
            version: 'unknown',
          },
        }

        return
      }

      addDocumentSync({ document: resolve.data, name, meta, config })
    },
    /**
     * Similar to addDocument but requires and in-mem object to be provided and loads the document synchronously
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
    addDocumentSync,
    /**
     * Returns the merged configuration for the active document.
     *
     * This getter merges configurations in the following order of precedence:
     * 1. Document-specific configuration (highest priority)
     * 2. Workspace-level configuration
     * 3. Default configuration (lowest priority)
     *
     * The active document is determined by the workspace's activeDocument extension,
     * falling back to the first document if none is specified.
     */
    get config() {
      return mergeObjects<typeof defaultConfig>(
        mergeObjects(defaultConfig, workspaceProps?.config ?? {}),
        documentConfigs[getActiveDocumentName()] ?? {},
      )
    },
    /**
     * Exports the specified document in the requested format.
     *
     * This method serializes the most recently saved local version of the document (from the intermediateDocuments map)
     * to either JSON or YAML. The exported document reflects the last locally saved state, including any edits
     * that have been saved but not yet synced to a remote registry. Runtime/in-memory changes that have not been saved
     * will not be included.
     *
     * @param documentName - The name of the document to export.
     * @param format - The output format: 'json' for a JSON string, or 'yaml' for a YAML string.
     * @returns The document as a string in the requested format, or undefined if the document does not exist.
     *
     * @example
     * // Export a document as JSON
     * const jsonString = store.exportDocument('api', 'json')
     *
     * // Export a document as YAML
     * const yamlString = store.exportDocument('api', 'yaml')
     */
    exportDocument: (documentName: string, format: 'json' | 'yaml') => {
      const intermediateDocument = intermediateDocuments[documentName]

      if (!intermediateDocument) {
        return
      }

      if (format === 'json') {
        return JSON.stringify(intermediateDocument)
      }

      return YAML.stringify(intermediateDocument)
    },
    /**
     * Saves the current state of the specified document to the intermediate documents map.
     *
     * This function captures the latest (reactive) state of the document from the workspace and
     * applies its changes to the corresponding entry in the `intermediateDocuments` map.
     * The `intermediateDocuments` map represents the most recently "saved" local version of the document,
     * which may include edits not yet synced to the remote registry.
     *
     * The update is performed in-place. A deep clone of the current document
     * state is used to avoid mutating the reactive object directly.
     *
     * @param documentName - The name of the document to save.
     * @returns An array of diffs that were excluded from being applied (such as changes to ignored keys),
     *          or undefined if the document does not exist or cannot be updated.
     *
     * @example
     * // Save the current state of the document named 'api'
     * const excludedDiffs = store.saveDocument('api')
     */
    saveDocument(documentName: string) {
      const intermediateDocument = intermediateDocuments[documentName]
      // Obtain the raw state of the current document to ensure accurate diffing
      const updatedDocument = toRaw(getRaw(workspace.documents[documentName]))

      // If either the intermediate or updated document is missing, do nothing
      if (!intermediateDocument || !updatedDocument) {
        return
      }

      // Apply changes from the current document to the intermediate document in place
      const excludedDiffs = applySelectiveUpdates(intermediateDocument, updatedDocument)
      return excludedDiffs
    },
    /**
     * Restores the specified document to its last locally saved state.
     *
     * This method updates the current reactive document (in the workspace) with the contents of the
     * corresponding intermediate document (from the `intermediateDocuments` map), effectively discarding
     * any unsaved in-memory changes and reverting to the last saved version.
     * Vue reactivity is preserved by updating the existing reactive object in place.
     *
     * **Warning:** This operation will discard all unsaved (in-memory) changes to the specified document.
     *
     * @param documentName - The name of the document to restore.
     * @returns void
     *
     * @example
     * // Restore the document named 'api' to its last saved state
     * store.revertDocumentChanges('api')
     */
    revertDocumentChanges(documentName: string) {
      const intermediateDocument = intermediateDocuments[documentName]
      // Get the raw state of the current document to avoid diffing resolved references.
      // This ensures we update the actual data, not the references.
      // Note: We keep the Vue proxy for reactivity by updating the object in place.
      const updatedDocument = getRaw(workspace.documents[documentName])

      if (!intermediateDocument || !updatedDocument) {
        return
      }

      // Overwrite the current document with the last saved state, discarding unsaved changes.
      applySelectiveUpdates(updatedDocument, intermediateDocument)
    },
    /**
     * Commits the specified document.
     *
     * This method is intended to finalize and persist the current state of the document,
     * potentially syncing it with a remote registry or marking it as the latest committed version.
     *
     * @param documentName - The name of the document to commit.
     * @remarks
     * The actual commit logic is not implemented yet.
     */
    commitDocument(documentName: string) {
      // TODO: Implement commit logic
      console.warn(`Commit operation for document '${documentName}' is not implemented yet.`)
    },
    /**
     * Serializes the current workspace state to a JSON string for backup, persistence, or sharing.
     *
     * This method exports all workspace documents (removing Vue reactivity proxies), workspace metadata,
     * document configurations, and both the original and intermediate document states. The resulting JSON
     * can be imported later to fully restore the workspace to this exact state, including all documents
     * and their configurations.
     *
     * @returns A JSON string representing the complete workspace state.
     */
    exportWorkspace() {
      return JSON.stringify({
        documents: {
          ...Object.fromEntries(
            Object.entries(workspace.documents).map(([name, doc]) => [
              name,
              // Extract the raw document data for export, removing any Vue reactivity wrappers.
              // When importing, the document can be wrapped again in a magic proxy.
              toRaw(getRaw(doc)),
            ]),
          ),
        },
        meta: workspaceProps?.meta ?? {},
        documentConfigs,
        originalDocuments,
        intermediateDocuments,
      } as InMemoryWorkspace)
    },
    /**
     * Imports a workspace from a serialized JSON string.
     *
     * This method parses the input string using the InMemoryWorkspaceSchema,
     * then updates the current workspace state, including documents, metadata,
     * and configuration, with the imported values.
     *
     * @param input - The serialized workspace JSON string to import.
     */
    loadWorkspace(input: string) {
      const result = coerceValue(InMemoryWorkspaceSchema, JSON.parse(input))

      // Assign the magic proxy to the documents
      safeAssign(
        workspace.documents,
        Object.fromEntries(Object.entries(result.documents).map(([name, doc]) => [name, createMagicProxy(doc)])),
      )

      safeAssign(originalDocuments, result.originalDocuments)
      safeAssign(intermediateDocuments, result.intermediateDocuments)
      safeAssign(documentConfigs, result.documentConfigs)
      safeAssign(workspace, result.meta)
    },
  }
}

// biome-ignore lint/performance/noBarrelFile: <explanation>
export { generateClientMutators } from '@/mutators'
