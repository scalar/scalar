import { escapeJsonPointer, upgrade } from '@scalar/openapi-parser'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getValueByPath, parseJsonPointer } from './helpers/json-path-utils'
import fs from 'node:fs/promises'
import { cwd } from 'node:process'

type WorkspaceMeta = Partial<{
  'x-scalar-dark-mode': boolean
  'x-scalar-default-client': string
  'x-scalar-active-document': string
  'x-scalar-theme': string
}>

type DocumentMeta = Partial<{ 'x-scalar-active-auth': string; 'x-scalar-active-server': string }>

type CreateServerWorkspace =
  | {
      directory?: string
      mode: 'static'
      documents: {
        name: string
        document: Record<string, unknown> | string
        meta?: DocumentMeta
      }[]
      meta?: WorkspaceMeta
    }
  | {
      baseUrl: string
      mode: 'ssr'
      documents: {
        name: string
        document: Record<string, unknown> | string
        meta?: DocumentMeta
      }[]
      meta?: WorkspaceMeta
    }

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
export function filterHttpMethodsOnly(paths: OpenAPIV3_1.PathsObject) {
  const result: OpenAPIV3_1.PathsObject = {}

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
export function escapePaths(paths: OpenAPIV3_1.PathsObject) {
  const result: OpenAPIV3_1.PathsObject = {}
  Object.keys(paths).forEach((path) => {
    result[escapeJsonPointer(path)] = paths[path]
  })

  return result
}

/**
 * Externalizes components by turning them into refs.
 */
export function externalizeComponentReferences(
  document: OpenAPIV3_1.Document,
  meta:
    | {
        mode: 'ssr'
        name: string
        baseUrl: string
      }
    | {
        mode: 'static'
        name: string
        directory: string
      },
) {
  const result: Record<string, any> = {}

  if (!document.components) {
    return result
  }

  Object.entries(document.components).forEach(([type, component]) => {
    result[type] = {}
    Object.keys(component).forEach((name) => {
      const ref =
        meta.mode === 'ssr'
          ? `https://${meta.baseUrl}#/${meta.name}/components/${type}/${name}`
          : `${meta.directory}/chunks/${meta.name}/components/${type}/${name}.json/#`

      result[type][name] = { '$ref': ref }
    })
  })

  return result
}

/**
 * Externalizes paths operations by turning them into refs.
 */
export function externalizePathReferences(
  document: OpenAPIV3_1.Document,
  meta: { mode: 'ssr'; name: string; baseUrl: string } | { mode: 'static'; name: string; directory: string },
) {
  const result: Record<string, any> = {}

  if (!document.paths) {
    return result
  }

  Object.entries(document.paths).forEach(([path, pathItem]) => {
    if (!pathItem) {
      return result
    }

    result[path] = {}

    const escapedPath = escapeJsonPointer(path)

    Object.keys(pathItem).forEach((type) => {
      if (httpMethods.has(type)) {
        const ref =
          meta.mode === 'ssr'
            ? `https://${meta.baseUrl}#/${meta.name}/operations/${escapedPath}/${type}`
            : `${meta.directory}/chunks/${meta.name}/operations/${escapedPath}/${type}.json/#`

        result[path][type] = { '$ref': ref }
      }
    })
  })

  return result
}

const DEFAULT_ASSETS_FOLDER = 'assets'
const WORKSPACE_FILE_NAME = 'scalar-workspace.json'

/**
 * Create server state workspace store
 */
export function createServerWorkspace(workspaceProps: CreateServerWorkspace) {
  const documents = workspaceProps.documents.map((el) => {
    const document = upgrade(el.document).specification

    return { ...el, document }
  })

  /**
   * Document chunks which can be loaded async from the client
   */
  const assets = documents.reduce<
    Record<string, { components?: OpenAPIV3_1.ComponentsObject; operations?: Record<string, unknown> }>
  >((acc, { name, document }) => {
    acc[name] = {
      components: document.components,
      operations: document.paths && escapePaths(filterHttpMethodsOnly(document.paths)),
    }
    return acc
  }, {})

  /**
   * Base workspace document which is going to give basic workspace information needed for the first render
   *
   * All the components and path operations are going to be refs
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

      acc[name] = { ...meta, ...document, components, paths }
      return acc
    }, {}),
  }

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
          for (const [path, methods] of Object.entries(operations as Record<string, Record<string, unknown>>)) {
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
      return getValueByPath(assets, parseJsonPointer(pointer))
    },
    addDocument: (document: Record<string, unknown>, meta: { name: string } & DocumentMeta) => {
      const { name, ...documentMeta } = meta

      const documentV3 = upgrade(document).specification

      // add the assets
      assets[meta.name] = {
        components: documentV3.schema?.components,
        operations: documentV3.schema?.paths && escapePaths(filterHttpMethodsOnly(documentV3.schema.paths as any)),
      }

      const options =
        workspaceProps.mode === 'ssr'
          ? { mode: workspaceProps.mode, name, baseUrl: workspaceProps.baseUrl }
          : { mode: workspaceProps.mode, name, directory: workspaceProps.directory ?? DEFAULT_ASSETS_FOLDER }

      const components = externalizeComponentReferences(documentV3, options)
      const paths = externalizePathReferences(documentV3, options)

      // at this point document should be partial document with refs that needs to be resolved async
      workspace.documents[meta.name] = { ...documentMeta, ...documentV3, components, paths }
    },
  }
}
