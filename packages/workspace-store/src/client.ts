import { measureAsync, measureSync } from '@scalar/helpers/testing/measure'
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'
import { type Difference, apply, diff, merge } from '@scalar/json-magic/diff'
import { createMagicProxy, getRaw } from '@scalar/json-magic/magic-proxy'
import { upgrade } from '@scalar/openapi-upgrader'
import type { Record } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { PartialDeep } from 'type-fest/source/partial-deep'
import type { RequiredDeep } from 'type-fest/source/required-deep'
import { reactive } from 'vue'
import YAML from 'yaml'

import { applySelectiveUpdates } from '@/helpers/apply-selective-updates'
import { deepClone } from '@/helpers/deep-clone'
import { type UnknownObject, isObject, safeAssign } from '@/helpers/general'
import { getValueByPath } from '@/helpers/json-path-utils'
import { mergeObjects } from '@/helpers/merge-object'
import { createOverridesProxy } from '@/helpers/overrides-proxy'
import { createNavigation } from '@/navigation'
import type { TraverseSpecOptions } from '@/navigation/types'
import { externalValueResolver, loadingStatus, refsEverywhere, restoreOriginalRefs } from '@/plugins'
import { getServersFromDocument } from '@/preprocessing/server'
import { extensions } from '@/schemas/extensions'
import { type InMemoryWorkspace, InMemoryWorkspaceSchema } from '@/schemas/inmemory-workspace'
import { defaultReferenceConfig } from '@/schemas/reference-config'
import { coerceValue } from '@/schemas/typebox-coerce'
import {
  OpenAPIDocumentSchema as OpenAPIDocumentSchemaStrict,
  type OpenApiDocument,
} from '@/schemas/v3.1/strict/openapi-document'
import type { Workspace, WorkspaceDocumentMeta, WorkspaceMeta } from '@/schemas/workspace'
import type { WorkspaceSpecification } from '@/schemas/workspace-specification'
import type { Config } from '@/schemas/workspace-specification/config'

export type DocumentConfiguration = Config &
  PartialDeep<{
    'x-scalar-reference-config': {
      tagSort: TraverseSpecOptions['tagsSorter']
      operationsSorter: TraverseSpecOptions['operationsSorter']
      getHeadingId: TraverseSpecOptions['getHeadingId']
      getOperationId: TraverseSpecOptions['getOperationId']
      getWebhookId: TraverseSpecOptions['getWebhookId']
      getModelId: TraverseSpecOptions['getModelId']
      getTagId: TraverseSpecOptions['getTagId']
      generateOperationSlug?: (details: {
        path: string
        operationId?: string
        method: string
        summary?: string
      }) => string
      generateHeadingSlug?: (details: { slug?: string }) => string
      generateTagSlug?: (details: { name?: string }) => string
      generateModelSlug?: (details: { name?: string }) => string
      generateWebhookSlug?: (details: { name: string; method: string }) => string
    }
  }>

type ExtraDocumentConfigurations = Record<
  string,
  {
    fetch: WorkspaceDocumentMetaInput['fetch']
  }
>

export type ValidationError = {
  message: string
  path: string
  schema: unknown
  value: unknown
}

const defaultConfig: RequiredDeep<Config> = {
  'x-scalar-reference-config': defaultReferenceConfig,
}

/**
 * Input type for workspace document metadata and configuration.
 * This type defines the required and optional fields for initializing a document in the workspace.
 */
type WorkspaceDocumentMetaInput = {
  /** Optional metadata about the document like title, description, etc */
  meta?: WorkspaceDocumentMeta
  /** Required unique identifier for the document */
  name: string
  /** Optional configuration options */
  config?: DocumentConfiguration
  /** Overrides for the document */
  overrides?: PartialDeep<OpenApiDocument>
  /** Optional custom fetch implementation to use when retrieving the document. By default the global fetch implementation will be used */
  fetch?: (input: string | URL | globalThis.Request, init?: RequestInit) => Promise<Response>
}

/**
 * Represents a document that is loaded from a URL.
 * This type extends WorkspaceDocumentMetaInput to include URL-specific properties.
 */
export type UrlDoc = {
  /** URL to fetch the OpenAPI document from */
  url: string
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
 * Returns the origin (URL) of a workspace document if it was loaded from a URL.
 * If the document was provided directly as an object, returns undefined.
 *
 * @param input - The workspace document input (either UrlDoc or ObjectDoc)
 * @returns The URL string if present, otherwise undefined
 */
const getDocumentSource = (input: WorkspaceDocumentInput) => {
  if ('url' in input) {
    return input.url
  }
  return undefined
}

/**
 * Configuration object for initializing a workspace store.
 * Defines the initial state and documents for the workspace.
 */
type WorkspaceProps = {
  /** Optional metadata for the workspace including theme, active document, etc */
  meta?: WorkspaceMeta
  /** Workspace configuration */
  config?: Config
  /** Fetch function for retrieving documents */
  fetch?: WorkspaceDocumentInput['fetch']
}

/**
 * Type definition for the workspace store return object.
 * This explicit type is needed to avoid TypeScript inference limits.
 *
 * @see https://github.com/microsoft/TypeScript/issues/43817#issuecomment-827746462
 */
export type WorkspaceStore = {
  /**
   * Returns the reactive workspace object with an additional activeDocument getter
   */
  readonly workspace: Workspace
  /**
   * Updates a specific metadata field in the workspace
   * @param key - The metadata field to update
   * @param value - The new value for the field
   * @example
   * // Update the workspace title
   * update('x-scalar-active-document', 'document-name')
   */
  update<K extends keyof WorkspaceMeta>(key: K, value: WorkspaceMeta[K]): void
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
  ): void
  /**
   * Replaces the content of a specific document in the workspace with the provided input.
   * This method computes the difference between the current document and the new input,
   * then applies only the necessary changes in place. The updates are applied atomically,
   * ensuring the document is updated in a single operation.
   *
   * @param documentName - The name of the document to update.
   * @param input - The new content to apply to the document (as a plain object).
   * @example
   * // Replace the content of the 'api' document with new data
   * store.replaceDocument('api', {
   *   openapi: '3.1.0',
   *   info: { title: 'Updated API', version: '1.0.1' },
   *   paths: {},
   * })
   */
  replaceDocument(documentName: string, input: Record<string, unknown>): Promise<void>
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
  resolve(path: string[]): Promise<unknown>
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
  addDocument(input: WorkspaceDocumentInput): Promise<void>
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
  readonly config: typeof defaultConfig
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
  exportDocument(documentName: string, format: 'json' | 'yaml'): string | undefined
  /**
   * Exports the currently active document in the requested format.
   *
   * This is a convenience method that exports the active document (determined by the workspace's
   * activeDocument extension) without requiring the caller to specify the document name.
   * The exported document reflects the last locally saved state, including any edits that have
   * been saved but not yet synced to a remote registry.
   *
   * @param format - The output format: 'json' for a JSON string, or 'yaml' for a YAML string.
   * @returns The active document as a string in the requested format, or undefined if no active document exists.
   *
   * @example
   * // Export the active document as JSON
   * const jsonString = store.exportActiveDocument('json')
   *
   * // Export the active document as YAML
   * const yamlString = store.exportActiveDocument('yaml')
   */
  exportActiveDocument(format: 'json' | 'yaml'): string | undefined
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
  saveDocument(documentName: string): Promise<unknown[] | undefined>
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
  revertDocumentChanges(documentName: string): Promise<void>
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
  commitDocument(documentName: string): void
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
  exportWorkspace(): string
  /**
   * Imports a workspace from a serialized JSON string.
   *
   * This method parses the input string using the InMemoryWorkspaceSchema,
   * then updates the current workspace state, including documents, metadata,
   * and configuration, with the imported values.
   *
   * @param input - The serialized workspace JSON string to import.
   */
  loadWorkspace(input: string): void
  /**
   * Imports a workspace from a WorkspaceSpecification object.
   *
   * This method assigns workspace metadata and adds all documents defined in the specification.
   * Each document is added using its $ref and optional overrides.
   *
   * @example
   * ```ts
   * await store.importWorkspaceFromSpecification({
   *   documents: {
   *     api: { $ref: '/specs/api.yaml' },
   *     petstore: { $ref: '/specs/petstore.yaml' }
   *   },
   *   overrides: {
   *     api: { config: { features: { showModels: true } } }
   *   },
   *   info: { title: 'My Workspace' },
   *   workspace: 'v1',
   *   "x-scalar-dark-mode": true
   * })
   * ```
   *
   * @param specification - The workspace specification to import.
   */
  importWorkspaceFromSpecification(specification: WorkspaceSpecification): Promise<void[]>
  /**
   * Rebases a document in the workspace with a new origin, resolving conflicts if provided.
   *
   * This method is used to rebase a document (e.g., after pulling remote changes) by applying the changes
   * from the new origin and merging them with local edits. If there are conflicts, they can be resolved
   * by providing a list of resolved conflicts.
   *
   * @param documentName - The name of the document to rebase.
   * @param newDocumentOrigin - The new origin document (as an object) to rebase onto.
   * @param resolvedConflicts - (Optional) An array of resolved conflicts to apply.
   * @returns If there are unresolved conflicts and no resolution is provided, returns the list of conflicts.
   *
   * @example
   * // Example: Rebase a document with a new origin and resolve conflicts
   * const conflicts = store.rebaseDocument('api', newOriginDoc)
   * if (conflicts && conflicts.length > 0) {
   *   // User resolves conflicts here...
   *   store.rebaseDocument('api', newOriginDoc, userResolvedConflicts)
   * }
   */
  rebaseDocument: (
    documentName: string,
    newDocumentOrigin: Record<string, unknown>,
    resolvedConflicts?: Difference<unknown>[],
  ) => void | ReturnType<typeof merge>['conflicts']
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
  const originalDocuments = {} as Record<string, UnknownObject>
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
  const intermediateDocuments = {} as Record<string, UnknownObject>
  /**
   * A map of document configurations keyed by document name.
   * This stores the configuration options for each document in the workspace,
   * allowing for document-specific settings like navigation options, appearance,
   * and other reference configuration.
   */
  const documentConfigs: Record<string, Config> = {}
  /**
   * Stores per-document overrides for OpenAPI documents.
   * This object is used to override specific fields of a document
   * when you cannot (or should not) modify the source document directly.
   * For example, this enables UI-driven or temporary changes to be applied
   * on top of the original document, without mutating the source.
   * The key is the document name, and the value is a deep partial
   * OpenAPI document representing the overridden fields.
   */
  const overrides: InMemoryWorkspace['overrides'] = {}
  /**
   * Holds additional metadata for each document in the workspace.
   *
   * This metadata should be persisted together with the document itself.
   * It can include information such as user preferences, UI state, or other
   * per-document attributes that are not part of the OpenAPI document structure.
   */
  const documentMeta: InMemoryWorkspace['documentMeta'] = {}

  /**
   * Holds additional configuration options for each document in the workspace.
   *
   * This can include settings that can not be persisted between sessions (not JSON serializable)
   */
  const extraDocumentConfigurations: ExtraDocumentConfigurations = {}

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

  function exportDocument(documentName: string, format: 'json' | 'yaml') {
    const intermediateDocument = intermediateDocuments[documentName]

    if (!intermediateDocument) {
      return
    }

    if (format === 'json') {
      return JSON.stringify(intermediateDocument)
    }

    return YAML.stringify(intermediateDocument)
  }

  // Save the current state of the specified document to the intermediate documents map.
  // This function captures the latest (reactive) state of the document from the workspace and
  // applies its changes to the corresponding entry in the `intermediateDocuments` map.
  // The `intermediateDocuments` map represents the most recently "saved" local version of the document,
  // which may include edits not yet synced to the remote registry.
  async function saveDocument(documentName: string) {
    const intermediateDocument = intermediateDocuments[documentName]
    const workspaceDocument = workspace.documents[documentName]

    if (!workspaceDocument) {
      return
    }

    // Obtain the raw state of the current document to ensure accurate diffing
    const updatedDocument = getRaw(workspaceDocument)

    // If either the intermediate or updated document is missing, do nothing
    if (!intermediateDocument || !updatedDocument) {
      return
    }

    // Traverse the document and convert refs back to the original shape
    const updatedWithOriginalRefs = await bundle(deepClone(updatedDocument), {
      plugins: [restoreOriginalRefs()],
      treeShake: false,
      urlMap: true,
    })

    // Apply changes from the current document to the intermediate document in place
    const excludedDiffs = applySelectiveUpdates(intermediateDocument, updatedWithOriginalRefs as UnknownObject)
    return excludedDiffs
  }

  const processDocument = (input: OpenApiDocument, options: Config & { documentSource?: string }): OpenApiDocument => {
    // Get the servers from the document or the config and perform some mutations on them
    const servers = getServersFromDocument(options['x-scalar-reference-config']?.settings?.servers ?? input.servers, {
      baseServerUrl: options['x-scalar-reference-config']?.settings?.baseServerUrl,
      documentUrl: options.documentSource,
    })

    if (servers.length) {
      input.servers = servers.map((it) => ({ url: it.url, description: it.description, variables: it.variables }))
    }

    return input
  }

  // Add a document to the store synchronously from an in-memory OpenAPI document
  async function addInMemoryDocument(input: ObjectDoc & { initialize?: boolean; documentSource?: string }) {
    const { name, meta } = input
    const cloned = measureSync('deepClone', () => deepClone(input.document))
    const inputDocument = measureSync('upgrade', () => upgrade(cloned))

    measureSync('initialize', () => {
      if (input.initialize !== false) {
        // Store the original document in the originalDocuments map
        // This is used to track the original state of the document as it was loaded into the workspace
        originalDocuments[name] = deepClone({ ...inputDocument })

        // Store the intermediate document state for local edits
        // This is used to track the last saved state of the document
        // It allows us to differentiate between the original document and the latest saved version
        // This is important for local edits that are not yet synced with the remote registry
        // The intermediate document is used to store the latest saved state of the document
        // This allows us to track changes and revert to the last saved state if needed
        intermediateDocuments[name] = deepClone({ ...inputDocument })
        // Add the document config to the documentConfigs map
        documentConfigs[name] = input.config ?? {}
        // Store the overrides for this document, or an empty object if none are provided
        overrides[name] = input.overrides ?? {}
        // Store the document metadata for this document, setting the origin if provided
        documentMeta[name] = { documentSource: input.documentSource }
        // Store extra document configurations that can not be persisted
        extraDocumentConfigurations[name] = { fetch: input.fetch }
      }
    })

    const strictDocument: UnknownObject = createMagicProxy({ ...inputDocument, ...meta }, { showInternal: true })

    strictDocument['x-original-oas-version'] = input.document.openapi ?? input.document.swagger

    if (strictDocument[extensions.document.navigation] === undefined) {
      // If the document navigation is not already present, bundle the entire document to resolve all references.
      // This typically applies when the document is not preprocessed by the server and needs local reference resolution.
      // We need to bundle document first before we validate, so we can also validate the external references
      await measureAsync(
        'bundle',
        async () =>
          await bundle(getRaw(strictDocument), {
            treeShake: false,
            plugins: [
              fetchUrls({
                fetch: extraDocumentConfigurations[name]?.fetch ?? workspaceProps?.fetch,
              }),
              externalValueResolver(),
              refsEverywhere(),
            ],
            urlMap: true,
            origin: documentMeta[name]?.documentSource, // use the document origin (if provided) as the base URL for resolution
          }),
      )

      // We coerce the values only when the document is not preprocessed by the server-side-store
      const coerced = measureSync('coerceValue', () =>
        coerceValue(OpenAPIDocumentSchemaStrict, deepClone(strictDocument)),
      )
      measureAsync('mergeObjects', async () => mergeObjects(strictDocument, coerced))
    }

    const isValid = Value.Check(OpenAPIDocumentSchemaStrict, strictDocument)

    if (!isValid) {
      const validationErrors = Array.from(Value.Errors(OpenAPIDocumentSchemaStrict, strictDocument))

      console.warn('document validation errors: ')
      console.warn(
        validationErrors.map((error) => ({
          message: error.message,
          path: error.path,
          schema: error.schema,
          value: error.value,
        })),
      )
    }

    // Skip navigation generation if the document already has a server-side generated navigation structure
    if (strictDocument[extensions.document.navigation] === undefined) {
      const showModels = input.config?.['x-scalar-reference-config']?.features?.showModels

      strictDocument[extensions.document.navigation] = createNavigation(strictDocument as OpenApiDocument, {
        ...(input.config?.['x-scalar-reference-config'] ?? {}),
        hideModels: showModels === undefined ? undefined : !showModels,
      }).entries

      // Do some document processing
      processDocument(getRaw(strictDocument as OpenApiDocument), {
        ...input.config,
        documentSource: input.documentSource,
      })
    }

    // Create a proxied document with magic proxy and apply any overrides, then store it in the workspace documents map
    // We create a new proxy here in order to hide internal properties after validation and processing
    // This ensures that the workspace document only exposes the intended OpenAPI properties and extensions
    workspace.documents[name] = createOverridesProxy(
      createMagicProxy(getRaw(strictDocument)) as OpenApiDocument,
      input.overrides,
    )
  }

  // Asynchronously adds a new document to the workspace by loading and validating the input.
  // If loading fails, a placeholder error document is added instead.
  async function addDocument(input: WorkspaceDocumentInput) {
    const { name, meta } = input

    const resolve = await measureAsync(
      'loadDocument',
      async () => await loadDocument({ ...input, fetch: input.fetch ?? workspaceProps?.fetch }),
    )

    // Log the time taken to add a document
    await measureAsync('addDocument', async () => {
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

      await addInMemoryDocument({
        ...input,
        document: resolve.data,
        documentSource: getDocumentSource(input),
      })
    })
  }

  // Returns the effective document configuration for a given document name,
  // merging (in order of increasing priority): the default config, workspace-level config, and document-specific config.
  const getDocumentConfiguration = (name: string) => {
    return mergeObjects<typeof defaultConfig>(
      mergeObjects(defaultConfig, workspaceProps?.config ?? {}),
      documentConfigs[name] ?? {},
    )
  }

  // Cache to track visited nodes during reference resolution to prevent bundling the same subtree multiple times
  // This is needed because we are doing partial bundle operations
  const visitedNodesCache = new Set()

  return {
    get workspace() {
      return workspace
    },
    update<K extends keyof WorkspaceMeta>(key: K, value: WorkspaceMeta[K]) {
      // @ts-ignore
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        throw new Error('Invalid key: cannot modify prototype')
      }
      Object.assign(workspace, { [key]: value })
    },
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
    async replaceDocument(documentName: string, input: Record<string, unknown>) {
      const currentDocument = workspace.documents[documentName]

      if (!currentDocument) {
        return console.error(`Document '${documentName}' does not exist in the workspace.`)
      }

      // Replace the whole document
      await addInMemoryDocument({
        name: documentName,
        document: input,
        // Preserve the current metadata
        meta: {
          'x-scalar-active-auth': currentDocument['x-scalar-active-auth'],
          'x-scalar-active-server': currentDocument['x-scalar-active-server'],
        },
        initialize: false,
      })
    },
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
        plugins: [fetchUrls(), loadingStatus(), externalValueResolver()],
        urlMap: true,
        visitedNodes: visitedNodesCache,
      })
    },
    addDocument,
    get config() {
      return getDocumentConfiguration(getActiveDocumentName())
    },
    exportDocument,
    exportActiveDocument: (format) => exportDocument(getActiveDocumentName(), format),
    saveDocument,
    async revertDocumentChanges(documentName: string) {
      const workspaceDocument = workspace.documents[documentName]
      const intermediate = intermediateDocuments[documentName]

      if (!workspaceDocument || !intermediate) {
        return
      }

      await addInMemoryDocument({
        name: documentName,
        document: intermediate,
        initialize: false,
      })
    },
    commitDocument(documentName: string) {
      // TODO: Implement commit logic
      console.warn(`Commit operation for document '${documentName}' is not implemented yet.`)
    },
    exportWorkspace() {
      return JSON.stringify({
        documents: {
          ...Object.fromEntries(
            Object.entries(workspace.documents).map(([name, doc]) => [
              name,
              // Extract the raw document data for export, removing any Vue reactivity wrappers.
              // When importing, the document can be wrapped again in a magic proxy.
              getRaw(doc),
            ]),
          ),
        },
        meta: workspaceProps?.meta ?? {},
        documentConfigs,
        originalDocuments,
        intermediateDocuments,
        overrides,
        documentMeta,
      } satisfies InMemoryWorkspace)
    },
    loadWorkspace(input: string) {
      const result = coerceValue(InMemoryWorkspaceSchema, JSON.parse(input))

      // Assign the magic proxy to the documents
      safeAssign(
        workspace.documents,
        Object.fromEntries(
          Object.entries(result.documents).map(([name, doc]) => [
            name,
            createOverridesProxy(createMagicProxy(doc), result.overrides[name]),
          ]),
        ),
      )

      safeAssign(originalDocuments, result.originalDocuments)
      safeAssign(intermediateDocuments, result.intermediateDocuments)
      safeAssign(documentConfigs, result.documentConfigs)
      safeAssign(overrides, result.overrides)
      safeAssign(workspace, result.meta)
      safeAssign(documentMeta, result.documentMeta)
    },
    importWorkspaceFromSpecification: (specification: WorkspaceSpecification) => {
      const { documents, overrides, info: _info, workspace: _workspaceVersion, ...meta } = specification

      // Assign workspace metadata
      safeAssign(workspace, meta)

      // Add workspace documents
      return Promise.all(
        Object.entries(documents ?? {}).map(([name, doc]) =>
          addDocument({ url: doc.$ref, name, overrides: overrides?.[name] }),
        ),
      )
    },
    rebaseDocument: (documentName, newDocumentOrigin, resolvedConflicts) => {
      const newOrigin = upgrade(newDocumentOrigin)

      const originalDocument = originalDocuments[documentName]
      const intermediateDocument = intermediateDocuments[documentName]
      const activeDocument = workspace.documents[documentName] ? getRaw(workspace.documents[documentName]) : undefined // raw version without any overrides

      if (!originalDocument || !intermediateDocument || !activeDocument) {
        // If any required document state is missing, do nothing
        return console.error('[ERROR]: Specified document is missing or internal corrupted workspace state')
      }

      // ---- Get the new intermediate document
      const changelogAA = diff(originalDocument, newOrigin)
      const changelogAB = diff(originalDocument, intermediateDocument)

      const changesA = merge(changelogAA, changelogAB)

      if (resolvedConflicts === undefined) {
        // If there are conflicts, return the list of conflicts for user resolution
        return changesA.conflicts
      }

      const changesetA = changesA.diffs.concat(resolvedConflicts)

      // Apply the changes to the original document to get the new intermediate
      const newIntermediateDocument = apply(deepClone(originalDocument), changesetA)
      intermediateDocuments[documentName] = newIntermediateDocument

      // Update the original document
      originalDocuments[documentName] = newOrigin

      // ---- Get the new active document
      const changelogBA = diff(intermediateDocument, newIntermediateDocument)
      const changelogBB = diff(intermediateDocument, activeDocument)

      const changesB = merge(changelogBA, changelogBB)

      // Auto-conflict resolution: pick only the changes from the first changeset
      // TODO: In the future, implement smarter conflict resolution if needed
      const changesetB = changesB.diffs.concat(changesB.conflicts.flatMap((it) => it[0]))

      const newActiveDocument = coerceValue(
        OpenAPIDocumentSchemaStrict,
        apply(deepClone(newIntermediateDocument), changesetB),
      )

      // Update the active document to the new value
      workspace.documents[documentName] = createOverridesProxy(
        createMagicProxy({ ...newActiveDocument }),
        overrides[documentName],
      )
      return
    },
  }
}

// biome-ignore lint/performance/noBarrelFile: It's a package entry point
export { generateClientMutators } from '@/mutators'
