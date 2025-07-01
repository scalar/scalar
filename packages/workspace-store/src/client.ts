import YAML from 'yaml'
import { reactive, toRaw } from 'vue'
import { bundle, upgrade } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins-browser'

import { createNavigation, type createNavigationOptions } from '@/navigation'
import type { DeepTransform } from '@/types'
import { createMagicProxy, getRaw } from '@/helpers/proxy'
import { deepClone, isObject } from '@/helpers/general'
import { mergeObjects } from '@/helpers/merge-object'
import { applySelectiveUpdates } from '@/helpers/apply-selective-updates'
import { getValueByPath } from '@/helpers/json-path-utils'
import type { WorkspaceMeta, WorkspaceDocumentMeta, Workspace } from '@/schemas/workspace'
import { extensions } from '@/schemas/extensions'
import { coerceValue } from '@/schemas/typebox-coerce'
import { OpenAPIDocumentSchema } from '@/schemas/v3.1/strict/openapi-document'
import { defaultReferenceConfig } from '@/schemas/reference-config'
import type { Config } from '@/schemas/workspace-specification/config'

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
type UrlDoc = {
  /** URL to fetch the OpenAPI document from */
  url: string
  /** Optional custom fetch implementation to use when retrieving the document. By default the global fetch implementation will be used */
  fetch?: (input: string | URL | globalThis.Request, init?: RequestInit) => Promise<Response>
} & WorkspaceDocumentMetaInput

/** Represents a document that is provided directly as an object rather than loaded from a URL */
type ObjectDoc = {
  /** The OpenAPI document object containing the API specification */
  document: Record<string, unknown>
} & WorkspaceDocumentMetaInput

/** Union type representing the possible input formats for a workspace document:
 * - UrlDoc: Document loaded from a URL with optional fetch configuration
 * - ObjectDoc: Direct document object with metadata
 */
type WorkspaceDocumentInput = UrlDoc | ObjectDoc

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
export function createWorkspaceStore(workspaceProps?: WorkspaceProps) {
  /**
   * Stores the original, unmodified documents before they are wrapped in reactive proxies.
   * These are the input documents in their raw form - not dereferenced, not bundled.
   * This preserves the original document structure.
   * The documents in this map are deep clones to prevent mutations from affecting the original data.
   * We keep these original documents so we can write them back to the registry when needed.
   */
  const originalDocuments = {} as Workspace['documents']
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

    // Create a deep clone of the document with metadata to preserve original structure
    originalDocuments[name] = deepClone({ ...document, ...meta })
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

      if (!resolve.ok || !isObject(resolve.data)) {
        console.error(`Can not load the document '${name}'`)
        workspace.documents[name] = {
          ...meta,
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
     * Downloads the specified document in the requested format.
     *
     * This method serializes the original, unmodified document (prior to any reactive wrapping or runtime changes)
     * to either JSON or YAML. The original document is used to ensure the output matches the initial structure,
     * without any runtime modifications or external references.
     *
     * @param documentName - The name of the document to download
     * @param format - The output format: 'json' for a JSON string, or 'yaml' for a YAML string
     * @returns The document as a string in the requested format, or undefined if the document does not exist
     *
     * @example
     * // Download a document as JSON
     * const jsonString = store.download('api', 'json')
     *
     * // Download a document as YAML
     * const yamlString = store.download('api', 'yaml')
     */
    download: (documentName: string, format: 'json' | 'yaml') => {
      const originalDocument = originalDocuments[documentName]

      if (!originalDocument) {
        return
      }

      if (format === 'json') {
        return JSON.stringify(originalDocument)
      }

      return YAML.stringify(originalDocument)
    },
    /**
     * Persists the current state of the specified document back to the original documents map.
     *
     * This method takes the current (reactive) document state and applies its changes to the
     * corresponding entry in the originalDocuments map, which holds the unmodified source documents.
     * The update is performed in-place to preserve reactivity, and a deep clone is used to avoid
     * mutating the reactive state directly.

     * @param documentName - The name of the document to save.
     * @returns An array of diffs that were excluded from being applied (e.g., changes to excluded keys),
     *          or undefined if the document does not exist or cannot be updated.
     *
     * @example
     * // Save the current state of the document named 'api'
     * const excludedDiffs = store.save('api')
     */
    save(documentName: string) {
      const originalDocument = originalDocuments[documentName]
      // Get the raw state of the active document to avoid diff issues
      const updatedDocument = toRaw(getRaw(workspace.documents[documentName]))

      // If either the original or updated document is not available, return undefined
      if (!originalDocument || !updatedDocument) {
        return
      }

      // Update the original document with the current state of the active document
      const excludedDiffs = applySelectiveUpdates(originalDocument, updatedDocument)
      return excludedDiffs
    },
    /**
     * Reverts the specified document to its original state.
     *
     * This method restores the document identified by `documentName` to its initial, unmodified state
     * by copying the original document (from the `originalDocuments` map) back into the current reactive document.
     * The operation preserves Vue reactivity by updating the existing reactive object in place.
     *
     * Note: All unsaved changes to the specified document will be lost after this operation.
     *
     * @param documentName - The name of the document to revert.
     * @returns void
     *
     * @example
     * // Revert the document named 'api' to its original state
     * store.revert('api')
     */
    revert(documentName: string) {
      const originalDocument = originalDocuments[documentName]
      // Get the raw state of the current document to avoid diff issues
      // This ensures that we don't diff the references
      // Note:  We still keep the vue proxy for reactivity
      //        This is important since we are writing back to the active document
      const updatedDocument = getRaw(workspace.documents[documentName])

      if (!originalDocument || !updatedDocument) {
        return
      }

      // Overwrite the current document with the original state, discarding unsaved changes.
      applySelectiveUpdates(updatedDocument, originalDocument)
    },
  }
}

export type WorkspaceStore = ReturnType<typeof createWorkspaceStore>
