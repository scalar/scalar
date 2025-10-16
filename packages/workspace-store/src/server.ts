import fs from 'node:fs/promises'
import { cwd } from 'node:process'

import { fetchUrls, readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { escapeJsonPointer } from '@scalar/json-magic/helpers/escape-json-pointer'
import { upgrade } from '@scalar/openapi-upgrader'

import { keyOf } from '@/helpers/general'
import { isAsyncApiDocument, isOpenApiOrSwaggerDocument } from '@/helpers/type-guards'
import { createAsyncApiNavigation, createNavigation } from '@/navigation'
import type { AsyncApiDocument } from '@/schemas/asyncapi/v3.0/asyncapi-document'
import type { ComponentsObject as AsyncApiComponentsObject } from '@/schemas/asyncapi/v3.0/components'
import type { OperationsObject } from '@/schemas/asyncapi/v3.0/operations'
import { extensions } from '@/schemas/extensions'
import type { TraversedEntry } from '@/schemas/navigation'
import { coerceValue } from '@/schemas/typebox-coerce'
import {
  OpenAPIDocumentSchema,
  type ComponentsObject as OpenApiComponentsObject,
  type OpenApiDocument,
  type OperationObject,
  type PathsObject,
} from '@/schemas/v3.1/strict/openapi-document'
import type { DocumentConfiguration } from '@/schemas/workspace-specification/config'

import { getValueByPath, parseJsonPointer } from './helpers/json-path-utils'
import type { WorkspaceDocumentMeta, WorkspaceMeta } from './schemas/workspace'

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
  config?: DocumentConfiguration
}
type CreateServerWorkspaceStore =
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
  for (const [path, methods] of Object.entries(paths)) {
    if (!methods) {
      continue
    }

    const filteredMethods: Record<string, any> = {}

    for (const [method, operation] of Object.entries(methods)) {
      if (httpMethods.has(method.toLowerCase())) {
        filteredMethods[method] = operation
      }
    }

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
  document: { components?: OpenApiComponentsObject | AsyncApiComponentsObject },
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

  Object.entries(document.paths).forEach(([path, pathItem]) => {
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
      } else {
        result[path][type] = pathItemRecord[type]
      }
    })
  })

  return result
}

/**
 * Externalizes AsyncAPI operations by turning them into refs.
 * This is similar to externalizePathReferences but for AsyncAPI's operation structure.
 */
export function externalizeAsyncApiOperationReferences(
  document: AsyncApiDocument,
  meta: { mode: 'ssr'; name: string; baseUrl: string } | { mode: 'static'; name: string; directory: string },
) {
  const result: Record<string, any> = {}

  if (!document.operations) {
    return result
  }

  Object.entries(document.operations).forEach(([operationId, operation]) => {
    if (!operation || typeof operation !== 'object') {
      return
    }

    const ref =
      meta.mode === 'ssr'
        ? `${meta.baseUrl}/${meta.name}/operations/${operationId}#`
        : `./chunks/${meta.name}/operations/${operationId}.json#`

    result[operationId] = { '$ref': ref, $global: true }
  })

  return result
}

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
async function loadDocument(workspaceDocument: WorkspaceDocumentInput) {
  if ('url' in workspaceDocument) {
    return fetchUrls().exec(workspaceDocument.url)
  }

  if ('path' in workspaceDocument) {
    return readFiles().exec(workspaceDocument.path)
  }

  return {
    ok: true as const,
    data: workspaceDocument.document,
  }
}

/**
 * Create server state workspace store.
 * Supports both OpenAPI and AsyncAPI documents.
 */
export async function createServerWorkspaceStore(workspaceProps: CreateServerWorkspaceStore) {
  /**
   * Base workspace document containing essential metadata and document references.
   *
   * This workspace document provides the minimal information needed for initial rendering.
   * All components and operations are replaced with references to enable lazy loading.
   *
   * In SSR mode, references point to API endpoints.
   * In static mode, references point to filesystem chunks.
   */
  const workspace = {
    ...workspaceProps.meta,
    documents: {} as Record<
      string,
      (OpenApiDocument | AsyncApiDocument) & { [extensions.document.navigation]: TraversedEntry[] }
    >,
  }

  /**
   * A map of document chunks that can be loaded asynchronously by the client.
   * Each document is split into components and operations to enable lazy loading.
   * The keys are document names and values contain the components and operations
   * for that document.
   *
   * For OpenAPI documents, operations are organized by path and HTTP method.
   * For AsyncAPI documents, operations are organized by operation ID.
   */
  const assets = {} as Record<
    string,
    {
      components?: OpenApiComponentsObject | AsyncApiComponentsObject
      operations?: Record<string, Record<string, OperationObject>> // OpenAPI operations
      asyncApiOperations?: OperationsObject // AsyncAPI operations
    }
  >

  /**
   * Adds a new document to the workspace.
   *
   * This function processes both OpenAPI and AsyncAPI documents by:
   * 1. Detecting the document type (OpenAPI, Swagger, or AsyncAPI)
   * 2. Converting OpenAPI/Swagger to OpenAPI 3.1 format if needed
   * 3. Separating documents into reusable components and operations
   * 4. Externalizing references based on the workspace mode (SSR or static)
   * 5. Generating appropriate navigation structure
   * 6. Adding the processed document to the workspace with its metadata
   *
   * The resulting document contains minimal information with externalized references
   * that will be resolved on-demand through the workspace's get() method.
   *
   * @param document - The OpenAPI or AsyncAPI document to process and add
   * @param meta - Document metadata containing the required name and optional settings
   */
  const addDocumentSync = (document: Record<string, unknown>, meta: { name: string } & WorkspaceDocumentMeta) => {
    const { name, ...documentMeta } = meta

    const options =
      workspaceProps.mode === 'ssr'
        ? { mode: workspaceProps.mode, name, baseUrl: workspaceProps.baseUrl }
        : { mode: workspaceProps.mode, name, directory: workspaceProps.directory ?? DEFAULT_ASSETS_FOLDER }

    if (isAsyncApiDocument(document)) {
      // Handle AsyncAPI documents
      const asyncApiDoc = document as AsyncApiDocument

      // Store AsyncAPI assets
      assets[meta.name] = {
        components: asyncApiDoc.components,
        asyncApiOperations: asyncApiDoc.operations,
      }

      // Externalize component references if components exist
      const components = asyncApiDoc.components
        ? externalizeComponentReferences({ components: asyncApiDoc.components }, options)
        : {}

      // Externalize AsyncAPI operation references
      const operations = externalizeAsyncApiOperationReferences(asyncApiDoc, options)

      // Build AsyncAPI navigation structure
      const { entries } = createAsyncApiNavigation(asyncApiDoc, workspaceProps.config ?? {})

      // Store the processed AsyncAPI document
      workspace.documents[meta.name] = {
        ...documentMeta,
        ...asyncApiDoc,
        components,
        operations,
        [extensions.document.navigation]: entries,
      }
    } else if (isOpenApiOrSwaggerDocument(document)) {
      // Handle OpenAPI/Swagger documents
      const documentV3 = coerceValue(OpenAPIDocumentSchema, upgrade(document, '3.1'))

      // Store OpenAPI assets
      assets[meta.name] = {
        components: documentV3.components,
        operations: documentV3.paths && escapePaths(filterHttpMethodsOnly(documentV3.paths)),
      }

      // Externalize component references
      const components = externalizeComponentReferences(documentV3, options)

      // Externalize path operation references
      const paths = externalizePathReferences(documentV3, options)

      // Build OpenAPI navigation structure
      const { entries } = createNavigation(documentV3, workspaceProps.config ?? {})

      // Store the processed OpenAPI document
      workspace.documents[meta.name] = {
        ...documentMeta,
        ...documentV3,
        components,
        paths,
        [extensions.document.navigation]: entries,
      }
    } else {
      console.warn(`Unsupported document type for "${name}". Expected OpenAPI, Swagger, or AsyncAPI document.`)
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
  const addDocument = async (input: WorkspaceDocumentInput) => {
    const document = await loadDocument(input)

    if (!document.ok) {
      console.warn(`Failed to load document "${input.name}`)
      return
    }

    addDocumentSync(document.data as Record<string, unknown>, { name: input.name, ...input.meta })
  }

  // Load and process all initial documents in parallel
  await Promise.all(workspaceProps.documents.map(addDocument))

  return {
    /**
     * Generates workspace chunks by writing components and operations to the filesystem.
     *
     * This method is only available in static mode. It creates a directory structure containing:
     * - A workspace file with metadata and document references
     * - Component chunks split by type (schemas, parameters, etc)
     * - Operation chunks split by path and HTTP method
     *
     * The generated workspace references will be relative file paths pointing to these chunks.
     *
     * @throws {Error} If called when mode is not 'static'
     */
    generateWorkspaceChunks: async () => {
      if (workspaceProps.mode !== 'static') {
        throw 'Mode has to be set to `static` to generate filesystem workspace chunks'
      }

      // Write the workspace document
      const directory = workspaceProps.directory ?? DEFAULT_ASSETS_FOLDER
      // Support both relative and absolute paths
      const basePath = directory.startsWith('/') ? directory : `${cwd()}/${directory}`
      await fs.mkdir(basePath, { recursive: true })

      // Write the workspace contents on the file system
      await fs.writeFile(`${basePath}/${WORKSPACE_FILE_NAME}`, JSON.stringify(workspace))

      // Write the chunks
      for (const [name, { components, operations, asyncApiOperations }] of Object.entries(assets)) {
        // Write the components chunks (same for both OpenAPI and AsyncAPI)
        if (components) {
          for (const [type, component] of Object.entries(components as Record<string, Record<string, unknown>>)) {
            const componentPath = `${basePath}/chunks/${name}/components/${type}`
            await fs.mkdir(componentPath, { recursive: true })

            for (const [key, value] of Object.entries(component)) {
              await fs.writeFile(`${componentPath}/${key}.json`, JSON.stringify(value))
            }
          }
        }

        // Write the OpenAPI operations chunks
        if (operations) {
          for (const [path, methods] of Object.entries(operations)) {
            const operationPath = `${basePath}/chunks/${name}/operations/${path}`
            await fs.mkdir(operationPath, { recursive: true })

            for (const [method, operation] of Object.entries(methods)) {
              await fs.writeFile(`${operationPath}/${method}.json`, JSON.stringify(operation))
            }
          }
        }

        // Write the AsyncAPI operations chunks
        if (asyncApiOperations) {
          const operationPath = `${basePath}/chunks/${name}/operations`
          await fs.mkdir(operationPath, { recursive: true })

          for (const [operationId, operation] of Object.entries(asyncApiOperations)) {
            await fs.writeFile(`${operationPath}/${operationId}.json`, JSON.stringify(operation))
          }
        }
      }
    },
    /**
     * Returns the workspace document containing metadata and all sparse documents.
     *
     * The workspace document includes:
     * - Global workspace metadata (theme, active document, etc)
     * - Document metadata and sparse document
     * - In SSR mode: References point to in-memory chunks
     * - In static mode: References point to filesystem chunks
     *
     * @returns The complete workspace document
     */
    getWorkspace: () => {
      return workspace
    },
    /**
     * Retrieves a chunk of data from the workspace using a JSON Pointer
     *
     * A JSON Pointer is a string that references a specific location in a JSON document.
     * Only components and operations chunks can be retrieved.
     *
     * @example
     * ```ts
     * // Get a component
     * get('#/document-name/components/schemas/User')
     *
     * // Get an OpenAPI operation
     * get('#/document-name/operations/pets/get')
     *
     * // Get an AsyncAPI operation
     * get('#/document-name/operations/publishUserSignedUp')
     * ```
     *
     * @param pointer - The JSON Pointer string to locate the chunk
     * @returns The chunk data if found, undefined otherwise
     */
    get: (pointer: string) => {
      const path = parseJsonPointer(pointer)

      // For AsyncAPI operations, we need to check if the document has asyncApiOperations
      // instead of nested operations (OpenAPI structure)
      if (path.length >= 2 && path[1] === 'operations') {
        const documentName = path[0]

        if (documentName && typeof documentName === 'string') {
          const documentAssets = assets[documentName]

          if (documentAssets?.asyncApiOperations) {
            // AsyncAPI: operations are flat (e.g., ['doc', 'operations', 'operationId'])
            if (path.length === 3 && path[2]) {
              return documentAssets.asyncApiOperations[path[2]]
            }
          }
        }
      }

      // Default behavior for OpenAPI and components
      return getValueByPath(assets, path)
    },
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
    addDocument,
  }
}
