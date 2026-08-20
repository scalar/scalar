import fs from 'node:fs/promises'
import { cwd } from 'node:process'

import { upgrade as upgradeAsyncApi } from '@scalar/asyncapi-upgrader'
import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { getValueAtPath } from '@scalar/helpers/object/get-value-at-path'
import type { LoaderPlugin } from '@scalar/json-magic/bundle'
import { fetchUrls, readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { escapeJsonPointer } from '@scalar/json-magic/helpers/escape-json-pointer'
import { upgrade } from '@scalar/openapi-upgrader'
import { asyncApiObjectSchema } from '@scalar/schemas/asyncapi/3.1'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { type Schema, coerce } from '@scalar/validation'

import { deepClone } from '@/helpers/deep-clone'
import { forEachPathItemOperation, getResolvedPathItem } from '@/helpers/for-each-path-item-operation'
import { keyOf } from '@/helpers/general'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { mergeObjects } from '@/helpers/merge-object'
import { createNavigation, traverseAsyncApiDocument } from '@/navigation'
import type { NavigationOptions } from '@/navigation/get-navigation-options'
import { extensions } from '@/schemas/extensions'
import type { TraversedDocument } from '@/schemas/navigation'
import { isAsyncApiDocument } from '@/schemas/type-guards'
import { coerceValue } from '@/schemas/typebox-coerce'
import {
  type ComponentsObject,
  OpenAPIDocumentSchema,
  type OpenApiDocument,
  type OperationObject,
  type PathsObject,
} from '@/schemas/v3.1/strict/openapi-document'

import type { Workspace, WorkspaceDocumentMeta, WorkspaceMeta } from './schemas/workspace'

const DEFAULT_ASSETS_FOLDER = 'assets'
export const WORKSPACE_FILE_NAME = 'scalar-workspace.json'

type WorkspaceDocumentMetaInput = {
  name: string
  meta?: WorkspaceDocumentMeta
}

type UrlDoc = { url: string } & WorkspaceDocumentMetaInput
type FileDoc = { path: string } & WorkspaceDocumentMetaInput
type ObjectDoc = { document: Record<string, unknown> } & WorkspaceDocumentMetaInput

type WorkspaceDocumentInput = UrlDoc | ObjectDoc | FileDoc

type CreateServerWorkspaceStoreBase = {
  documents: WorkspaceDocumentInput[]
  meta?: WorkspaceMeta
  navigationOptions?: NavigationOptions
}
type CreateServerWorkspaceStoreProps =
  | ({
      directory?: string
      mode: 'static'
    } & CreateServerWorkspaceStoreBase)
  | ({
      baseUrl: string
      mode: 'ssr'
    } & CreateServerWorkspaceStoreBase)

const httpMethods = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'])

/**
 * Filters an OpenAPI PathsObject to only include standard HTTP methods.
 * Removes any vendor extensions or other non-HTTP properties.
 *
 * @param paths - The OpenAPI PathsObject to filter
 * @returns A new PathsObject containing only standard HTTP methods
 *
 * @example
 * Input: {
 *   "/users": {
 *     "get": {...},
 *     "x-custom": {...},
 *     "post": {...}
 *   }
 * }
 * Output: {
 *   "/users": {
 *     "get": {...},
 *     "post": {...}
 *   }
 * }
 */
export function filterHttpMethodsOnly(paths: PathsObject): Record<string, Record<string, OperationObject>> {
  const result: Record<string, Record<string, OperationObject>> = {}

  // Todo: skip extension properties
  for (const [path, pathItemRef] of Object.entries(paths)) {
    const filteredMethods: Record<string, OperationObject> = {}

    forEachPathItemOperation(pathItemRef, (method, operation) => {
      if (httpMethods.has(method.toLowerCase())) {
        filteredMethods[method] = getResolvedRef(operation) ?? operation
      }
    })

    if (Object.keys(filteredMethods).length > 0) {
      result[path] = filteredMethods
    }
  }

  return result
}

/**
 * Escapes path keys in an OpenAPI PathsObject to be JSON Pointer compatible.
 * This is necessary because OpenAPI paths can contain characters that need to be escaped
 * when used as JSON Pointer references (like '/' and '~').
 *
 * @example
 * Input: { "/users/{id}": { ... } }
 * Output: { "/users~1{id}": { ... } }
 */
export function escapePaths(
  paths: Record<string, Record<string, OperationObject>>,
): Record<string, Record<string, OperationObject>> {
  const result: Record<string, Record<string, OperationObject>> = {}

  Object.keys(paths).forEach((path) => {
    if (paths[path]) {
      result[escapeJsonPointer(path)] = paths[path]
    }
  })

  return result
}

/**
 * Externalizes components by turning them into refs.
 */
export function externalizeComponentReferences(
  document: OpenApiDocument,
  meta: { mode: 'ssr'; name: string; baseUrl: string } | { mode: 'static'; name: string; directory: string },
) {
  const result: Record<string, any> = {}

  if (!document.components) {
    return result
  }

  Object.entries(document.components).forEach(([type, component]) => {
    if (!component || typeof component !== 'object') {
      return
    }

    result[type] = {}
    Object.keys(component).forEach((name) => {
      const ref =
        meta.mode === 'ssr'
          ? `${meta.baseUrl}/${meta.name}/components/${type}/${name}#`
          : `./chunks/${meta.name}/components/${type}/${name}.json#`

      result[type][name] = { '$ref': ref, $global: true }
    })
  })

  return result
}

/**
 * Externalizes paths operations by turning them into refs.
 */
export function externalizePathReferences(
  document: OpenApiDocument,
  meta: { mode: 'ssr'; name: string; baseUrl: string } | { mode: 'static'; name: string; directory: string },
) {
  const result: Record<string, any> = {}

  if (!document.paths) {
    return result
  }

  Object.entries(document.paths).forEach(([path, pathItemRef]) => {
    const pathItem = getResolvedPathItem(pathItemRef)
    if (!pathItem || typeof pathItem !== 'object') {
      return
    }

    const pathItemRecord = pathItem as Record<string, unknown>

    result[path] = {}

    const escapedPath = escapeJsonPointer(path)

    keyOf(pathItemRecord).forEach((type) => {
      if (httpMethods.has(type)) {
        const ref =
          meta.mode === 'ssr'
            ? `${meta.baseUrl}/${meta.name}/operations/${escapedPath}/${type}#`
            : `./chunks/${meta.name}/operations/${escapedPath}/${type}.json#`

        result[path][type] = { '$ref': ref, $global: true }
      } else if (type !== '$ref') {
        // Skip the path-item `$ref` merged in by getResolvedPathItem: the referenced component is
        // externalized on its own and the operations are externalized above, so keeping it would
        // emit a hybrid entry with both a component `$ref` and inlined operation references.
        result[path][type] = pathItemRecord[type]
      }
    })
  })

  return result
}

type ServerWorkspace = Omit<Workspace, 'activeDocument'>

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
 * // Resolve direct document
 * const directDoc = await loadDocument({
 *   name: 'inline',
 *   document: { openapi: '3.0.0', paths: {} }
 * })
 */
function loadDocument(workspaceDocument: WorkspaceDocumentInput): ReturnType<LoaderPlugin['exec']> {
  if ('url' in workspaceDocument) {
    return fetchUrls().exec(workspaceDocument.url)
  }

  if ('path' in workspaceDocument) {
    return readFiles().exec(workspaceDocument.path)
  }

  return Promise.resolve({
    ok: true,
    data: workspaceDocument.document,
    raw: JSON.stringify(workspaceDocument.document),
  })
}

/**
 * Server workspace store interface
 */
export type ServerWorkspaceStore = {
  /**
   * Loads and registers a document in the workspace.
   *
   * Supported inputs include:
   * - `url`: fetch and parse an OpenAPI or AsyncAPI document from a remote URL
   * - `path`: read and parse an OpenAPI or AsyncAPI document from the filesystem
   * - `document`: use an in-memory OpenAPI or AsyncAPI object directly
   *
   * If loading fails, the document is not added.
   *
   * @example
   * ```ts
   * await store.addDocument({
   *   url: 'https://example.com/openapi.json',
   *   name: 'petstore',
   * })
   *
   * await store.addDocument({
   *   path: './specs/billing.yaml',
   *   name: 'billing',
   * })
   * ```
   *
   * @param input - Source and metadata used to load and register the document
   */
  addDocument: (input: WorkspaceDocumentInput, navigationOptions?: NavigationOptions) => Promise<void>
  /**
   * Generates chunk files for all loaded documents.
   *
   * Only available in `static` mode. Writes chunk files for:
   * - workspace metadata
   * - components (schemas, parameters, responses, etc.)
   * - operations (grouped by path and HTTP method)
   *
   * After generation, workspace references point to relative file paths.
   *
   * @example
   * ```ts
   * const store = await createServerWorkspaceStore({
   *   mode: 'static',
   *   outputPath: './dist/workspace',
   *   meta: { title: 'Docs' },
   * })
   *
   * await store.generateWorkspaceChunks()
   * ```
   *
   * @throws {Error} If called when mode is not 'static'
   */
  generateWorkspaceChunks: () => Promise<void>
  /**
   * Returns the current workspace payload.
   *
   * The payload contains workspace metadata plus sparse documents whose heavy
   * sections are replaced by references:
   * - in `ssr` mode, references resolve from in-memory assets
   * - in `static` mode, references point to generated chunk files
   *
   * @example
   * ```ts
   * const workspace = store.getWorkspace()
   *
   * // Read available document names
   * const names = Object.keys(workspace.documents)
   * ```
   *
   * @returns Workspace metadata and document references used by the client
   */
  getWorkspace: () => ServerWorkspace
  /**
   * Resolves a chunk by JSON Pointer.
   *
   * Pointers can target component and operation chunks for loaded documents.
   * Returns `undefined` when the pointer does not resolve.
   *
   * @example
   * ```ts
   * // Resolve a component chunk
   * const userSchema = store.get('#/petstore/components/schemas/User')
   *
   * // Resolve an operation chunk
   * const listPets = store.get('#/petstore/operations/pets/get')
   * ```
   *
   * @param pointer - JSON Pointer to the desired chunk
   * @returns The resolved chunk, or `undefined` when not found
   */
  get: (pointer: string) => unknown
}

/**
 * Create server state workspace store
 */
export async function createServerWorkspaceStore(
  workspaceProps: CreateServerWorkspaceStoreProps,
): Promise<ServerWorkspaceStore> {
  /**
   * Base workspace document containing essential metadata and document references.
   *
   * This workspace document provides the minimal information needed for initial rendering.
   * All components and path operations are replaced with references to enable lazy loading.
   *
   * In SSR mode, references point to API endpoints.
   * In static mode, references point to filesystem chunks.
   */
  const workspace: ServerWorkspace = {
    ...workspaceProps.meta,
    documents: {} as Record<string, OpenApiDocument & { [extensions.document.navigation]: TraversedDocument }>,
  }

  /**
   * A map of document chunks that can be loaded asynchronously by the client.
   * Each document is split into components and operations to enable lazy loading.
   * The keys are document names and values contain the components and operations
   * for that document.
   */
  const assets = {} as Record<
    string,
    { components?: ComponentsObject; operations?: Record<string, Record<string, OperationObject>> }
  >

  /**
   * Adds an AsyncAPI document to the workspace.
   *
   * AsyncAPI keeps its content under `channels` and `operations` instead of `paths`, so none of the
   * OpenAPI externalization applies: there are no path operations to split into chunks, and the
   * consumers read channels and operations straight off the stored document. The document is
   * therefore kept whole, and only the AsyncAPI upgrader runs so 1.x/2.x documents reach the 3.x
   * shape the traversal and renderer expect.
   *
   * @param document - The AsyncAPI document to process and add
   * @param meta - The document name plus any metadata to merge onto the stored document
   */
  const addAsyncApiDocumentSync = (
    document: AsyncApiDocument,
    { name, documentMeta }: { name: string; documentMeta: WorkspaceDocumentMeta },
    navigationOptions?: NavigationOptions,
  ) => {
    // Capture the original version before the upgrader bumps `asyncapi` to the latest.
    const originalAasVersion = document.asyncapi

    // Clone first: the upgrader and the traversal both write to the document they are handed, and
    // the caller may keep using the object it passed in.
    // The upgrader is typed against the loose `UnknownObject` shape; the result is a valid 3.x
    // AsyncAPI document, so cast it back.
    const asyncApiDocument = upgradeAsyncApi(deepClone(document)) as AsyncApiDocument

    // Coerced against the AsyncAPI schema for the same reason the OpenAPI path coerces against its
    // own: the traversal and every consumer downstream expect a normalized document. Skipping it
    // leaves `info` missing on a partial document (which the traversal reads unguarded) and passes
    // shapes like `channels: null` straight through to the browser. Merged rather than assigned, so
    // nothing the schema does not model is dropped.
    mergeObjects(asyncApiDocument, coerce(asyncApiObjectSchema as Schema, deepClone(asyncApiDocument)))

    // Nothing is externalized, so the document owns no chunks. The empty entry keeps `get()` and
    // chunk generation well defined for the document name.
    assets[name] = {}

    // Traversed before the spread below: its last act is a top-level `x-scalar-order` write on the
    // document, and a snapshot taken first would both miss it and preserve whatever stale order the
    // input arrived with.
    const navigation = traverseAsyncApiDocument(
      name,
      asyncApiDocument,
      navigationOptions ?? workspaceProps.navigationOptions,
    )

    workspace.documents[name] = {
      ...documentMeta,
      ...asyncApiDocument,
      'x-original-aas-version': originalAasVersion,
      [extensions.document.navigation]: navigation,
    }

    // A document carrying both discriminators is ingested as AsyncAPI here, but `getDocumentType`
    // checks OpenAPI first — so leaving `openapi` in place would hand an OpenAPI renderer a
    // navigation tree of channel entries. The document is stored as the type it was read as.
    delete (workspace.documents[name] as Record<string, unknown>)['openapi']
  }

  /**
   * Adds a new document to the workspace.
   *
   * This function processes an OpenAPI document by:
   * 1. Converting it to OpenAPI 3.1 format if needed
   * 2. Separating it into reusable components and path operations
   * 3. Externalizing references based on the workspace mode (SSR or static)
   * 4. Adding the processed document to the workspace with its metadata
   *
   * The resulting document contains minimal information with externalized references
   * that will be resolved on-demand through the workspace's get() method.
   *
   * @param document - The OpenAPI document to process and add
   * @param meta - Document metadata containing the required name and optional settings
   */
  const addDocumentSync = (
    document: Record<string, unknown>,
    meta: { name: string } & WorkspaceDocumentMeta,
    navigationOptions?: NavigationOptions,
  ) => {
    const { name, ...documentMeta } = meta

    // AsyncAPI documents get their own ingestion path, mirroring the client store. The OpenAPI
    // upgrade and coerce steps would strip `channels` and `operations`, inject an empty
    // `openapi: ''` that breaks the type discriminator, and add an empty `paths` object.
    if (isAsyncApiDocument(document)) {
      addAsyncApiDocumentSync(document, { name, documentMeta }, navigationOptions)
      return
    }

    const documentV3 = coerceValue(OpenAPIDocumentSchema, upgrade(document, '3.1'))

    // add the assets
    assets[meta.name] = {
      components: documentV3.components,
      operations: documentV3.paths && escapePaths(filterHttpMethodsOnly(documentV3.paths)),
    }

    const options =
      workspaceProps.mode === 'ssr'
        ? { mode: workspaceProps.mode, name, baseUrl: workspaceProps.baseUrl }
        : { mode: workspaceProps.mode, name, directory: workspaceProps.directory ?? DEFAULT_ASSETS_FOLDER }

    const components = externalizeComponentReferences(documentV3, options)
    const paths = externalizePathReferences(documentV3, options)

    // Build the sidebar entries
    const navigation = createNavigation(name, documentV3, navigationOptions ?? workspaceProps.navigationOptions)

    // The document is now a minimal version with externalized references to components and operations.
    // These references will be resolved asynchronously when needed through the workspace's get() method.
    workspace.documents[meta.name] = {
      ...documentMeta,
      ...documentV3,
      components,
      paths,
      [extensions.document.navigation]: navigation,
    }
  }

  /**
   * Adds a new document to the workspace asynchronously.
   *
   * This function:
   * 1. Loads the document using the provided input
   * 2. Checks if the document loaded successfully
   * 3. If successful, adds the document to the workspace using addDocumentSync
   *
   * @param input - The document input containing the document source and metadata
   */
  const addDocument: ServerWorkspaceStore['addDocument'] = async (input, navigationOptions) => {
    // Captured so a failed add restores exactly what was there. The assets are written partway
    // through, and several steps throw before that point, so clearing the key outright would strip
    // a working document's chunks whenever a name is reused — leaving the workspace pointing at
    // references that resolve to nothing.
    //
    // The snapshot is taken before the first await, so two adds racing under the same name would
    // both capture the pre-state and the failing one could put back what the other just replaced.
    // Adds are not serialized per name: concurrent adds sharing a name are already last-write-wins,
    // and callers are expected to await one before starting another.
    const assetsBeforeAdd = assets[input.name]

    try {
      const document = await loadDocument(input)

      if (!document.ok) {
        console.warn(`Failed to load document "${input.name}"`)
        return
      }

      addDocumentSync(document.data as Record<string, unknown>, { name: input.name, ...input.meta }, navigationOptions)
    } catch (error) {
      // Honours the contract above: a document that cannot be processed is skipped rather than
      // taking the workspace with it, since the initial documents are ingested together and one
      // malformed description should not fail an entire documentation build. Loading is inside the
      // try too, so a document that cannot even be serialized is skipped the same way.
      if (assetsBeforeAdd === undefined) {
        delete assets[input.name]
      } else {
        assets[input.name] = assetsBeforeAdd
      }

      console.warn(`Failed to process document "${input.name}"`, error)
    }
  }

  // Load and process all initial documents in parallel
  await Promise.all(workspaceProps.documents.map((document) => addDocument(document)))

  return {
    generateWorkspaceChunks: async () => {
      if (workspaceProps.mode !== 'static') {
        throw 'Mode has to be set to `static` to generate filesystem workspace chunks'
      }

      // Write the workspace document
      const basePath = `${cwd()}/${workspaceProps.directory ?? DEFAULT_ASSETS_FOLDER}`
      await fs.mkdir(basePath, { recursive: true })

      // Write the workspace contents on the file system
      await fs.writeFile(`${basePath}/${WORKSPACE_FILE_NAME}`, JSON.stringify(workspace))

      // Write the chunks
      for (const [name, { components, operations }] of Object.entries(assets)) {
        // Write the components chunks
        if (components) {
          for (const [type, component] of Object.entries(components as Record<string, Record<string, unknown>>)) {
            const componentPath = `${basePath}/chunks/${name}/components/${type}`
            await fs.mkdir(componentPath, { recursive: true })

            for (const [key, value] of Object.entries(component)) {
              await fs.writeFile(`${componentPath}/${key}.json`, JSON.stringify(value))
            }
          }
        }

        // Write the operations chunks
        if (operations) {
          for (const [path, methods] of Object.entries(operations)) {
            const operationPath = `${basePath}/chunks/${name}/operations/${path}`
            await fs.mkdir(operationPath, { recursive: true })

            for (const [method, operation] of Object.entries(methods)) {
              await fs.writeFile(`${operationPath}/${method}.json`, JSON.stringify(operation))
            }
          }
        }
      }
    },
    getWorkspace: () => {
      return workspace
    },
    get: (pointer: string) => {
      const pointerPath = (() => {
        if (pointer.startsWith('#')) {
          return pointer.slice(1)
        }

        if (pointer.startsWith('/')) {
          return pointer
        }

        try {
          return new URL(pointer).pathname
        } catch {
          return pointer
        }
      })()

      // Keep the path segments escaped cuz we store them on the filesystem as escaped sequences
      const path = parseJsonPointerSegments(pointerPath).map(escapeJsonPointer)
      return getValueAtPath(assets, path)
    },
    addDocument,
  }
}
