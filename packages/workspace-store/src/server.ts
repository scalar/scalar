import { escapeJsonPointer, upgrade } from '@scalar/openapi-parser'
import { getValueByPath, parseJsonPointer } from './helpers/json-path-utils'
import type { WorkspaceDocumentMeta, WorkspaceMeta } from './schemas/workspace'
import fs from 'node:fs/promises'
import { cwd } from 'node:process'
import { createNavigation, type createNavigationOptions } from '@/navigation'
import { extensions } from '@/schemas/extensions'
import { coerceValue } from '@/schemas/typebox-coerce'
import { OpenAPIDocumentSchema, type OpenApiDocument } from '@/schemas/v3.1/strict/openapi-document'
import type { PathsObject } from '@/schemas/v3.1/strict/paths'
import { keyOf } from '@/helpers/general'
import type { ComponentsObject } from '@/schemas/v3.1/strict/components'
import type { OperationObject } from '@/schemas/v3.1/strict/path-operations'

const DEFAULT_ASSETS_FOLDER = 'assets'
export const WORKSPACE_FILE_NAME = 'scalar-workspace.json'

// TODO: support input document from different sources
type CreateServerWorkspaceStoreBase = {
  documents: {
    name: string
    document: Record<string, unknown> | string
    meta?: WorkspaceDocumentMeta
  }[]
  meta?: WorkspaceMeta
  config?: createNavigationOptions
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
export function filterHttpMethodsOnly(paths: PathsObject) {
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
export function escapePaths(paths: Record<string, Record<string, OperationObject>>) {
  const result: Record<string, Record<string, OperationObject>> = {}
  Object.keys(paths).forEach((path) => {
    result[escapeJsonPointer(path)] = paths[path]
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
      return result
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
      return result
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
 * Create server state workspace store
 */
export function createServerWorkspaceStore(workspaceProps: CreateServerWorkspaceStore) {
  const documents = workspaceProps.documents.map((el) => {
    const document = upgrade(el.document).specification

    const castedDocument = coerceValue(OpenAPIDocumentSchema, document)

    return { ...el, document: castedDocument }
  })

  /**
   * A map of document chunks that can be loaded asynchronously by the client.
   * Each document is split into components and operations to enable lazy loading.
   * The keys are document names and values contain the components and operations
   * for that document.
   */
  const assets = documents.reduce<
    Record<string, { components?: ComponentsObject; operations?: Record<string, Record<string, OperationObject>> }>
  >((acc, { name, document }) => {
    acc[name] = {
      components: document.components,
      operations: document.paths && escapePaths(filterHttpMethodsOnly(document.paths)),
    }
    return acc
  }, {})

  /**
   * Base workspace document containing essential metadata and document references.
   *
   * This workspace document provides the minimal information needed for initial rendering.
   * All components and path operations are replaced with references to enable lazy loading.
   *
   * In SSR mode, references point to API endpoints.
   * In static mode, references point to filesystem chunks.
   */
  const workspace = {
    ...workspaceProps.meta,
    documents: documents.reduce<Record<string, Record<string, unknown>>>((acc, { name, document, meta }) => {
      const options =
        workspaceProps.mode === 'ssr'
          ? { mode: workspaceProps.mode, name, baseUrl: workspaceProps.baseUrl }
          : { mode: workspaceProps.mode, name, directory: workspaceProps.directory ?? DEFAULT_ASSETS_FOLDER }

      // Transform the original document by setting all the components and paths operations on refs
      const components = externalizeComponentReferences(document, options)
      const paths = externalizePathReferences(document, options)

      // Here we create the sidebar
      const { entries } = createNavigation(document, workspaceProps.config ?? {})

      acc[name] = { ...meta, ...document, components, paths, [extensions.document.navigation]: entries }
      return acc
    }, {}),
  }

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
     * // Get an operation
     * get('#/document-name/operations/pets/get')
     * ```
     *
     * @param pointer - The JSON Pointer string to locate the chunk
     * @returns The chunk data if found, undefined otherwise
     */
    get: (pointer: string) => {
      return getValueByPath(assets, parseJsonPointer(pointer))
    },
    /**
     * Adds a new document to the workspace.
     *
     * The document will be:
     * - Upgraded to OpenAPI 3.1 if needed
     * - Split into components and operations chunks
     * - Have its references externalized based on the workspace mode
     * - Added to the workspace with its metadata
     *
     * @param document - The OpenAPI document to add
     * @param meta - Document metadata including required name and optional settings
     */
    addDocument: (document: Record<string, unknown>, meta: { name: string } & WorkspaceDocumentMeta) => {
      const { name, ...documentMeta } = meta

      const documentV3 = coerceValue(OpenAPIDocumentSchema, upgrade(document).specification)

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
      const { entries } = createNavigation(documentV3, workspaceProps.config ?? {})

      // The document is now a minimal version with externalized references to components and operations.
      // These references will be resolved asynchronously when needed through the workspace's get() method.
      workspace.documents[meta.name] = {
        ...documentMeta,
        ...documentV3,
        components,
        paths,
        [extensions.document.navigation]: entries,
      }
    },
  }
}
