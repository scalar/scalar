import path from 'node:path'
import { cwd } from 'node:process'

import { getOwnEntry } from '@scalar/helpers/object/get-own-entry'
import { isObject, isObjectLike } from '@scalar/helpers/object/is-object'
import { safeRun } from '@scalar/helpers/types/safe-run'
import { bundle, resolveReferencePath } from '@scalar/json-magic/bundle'
import { fetchUrls, parseJson, parseYaml, readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { isFilePath } from '@scalar/json-magic/helpers/is-file-path'
import { isHttpUrl } from '@scalar/json-magic/helpers/is-http-url'
import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import type { OpenAPIV3_1, OpenAPIV3_2 } from '@scalar/openapi-types'
import { upgrade } from '@scalar/openapi-upgrader'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { openApiDocument, resolveOpenApiDocument } from '@scalar/workspace-store/plugins/bundler'
import { isPluginDocument } from '@scalar/workspace-store/schemas/plugin-document'
import { isAsyncApiDocument } from '@scalar/workspace-store/schemas/type-guards'

import { cloneDocument } from '@/utils/clone-document'

/** A processed API description, tagged so each mock engine receives its own document type. */
export type ProcessedDocument =
  | {
      type: 'openapi'
      document: OpenAPIV3_1.Document | OpenAPIV3_2.Document
      originalOpenapiVersion?: string
      retrievalUri?: string
      serverRetrievalUris: WeakMap<object, string>
    }
  | { type: 'asyncapi'; document: AsyncApiDocument }

/** Track external server lists by identity so their source URL stays with the resolved object. */
const indexServerRetrievalUris = (documents: unknown, mappings: unknown, baseUri: string): WeakMap<object, string> => {
  const origins = new WeakMap<object, string>()
  const visited = new WeakSet<object>()

  const indexBundle = (
    documents: unknown,
    mappings: unknown,
    baseUri: string | undefined,
    parentUri?: string,
  ): void => {
    if (!isObject(documents)) {
      return
    }
    const sources = isObject(mappings) ? mappings : undefined

    for (const [key, document] of Object.entries(documents)) {
      const source = getOwnEntry(sources, key)
      const resolved = safeRun(() => {
        if (typeof source !== 'string') {
          return parentUri
        }
        if (baseUri) {
          return resolveReferencePath(baseUri, source)
        }
        return URL.canParse(source) ? source : parentUri
      })
      const retrievalUri = resolved.ok ? resolved.data : parentUri

      const stack = [document]
      while (stack.length > 0) {
        const node = stack.pop()
        if (!isObjectLike(node) || visited.has(node)) {
          continue
        }
        visited.add(node)
        if (retrievalUri && Array.isArray(node.servers)) {
          origins.set(node.servers, retrievalUri)
        }
        for (const [key, child] of Object.entries(node)) {
          if (node === document && key === 'x-ext' && isObject(child)) {
            // Imported bundles record their URL mappings relative to their own base URI.
            // An absolute document identity can resolve relative mappings even without a retrieval URI.
            const self = node.$self
            const identityBase = retrievalUri ?? (typeof self === 'string' && URL.canParse(self) ? self : undefined)
            const identity = identityBase ? safeRun(() => resolveOpenApiDocument(node, identityBase)) : undefined
            const nestedBase = (identity?.ok ? identity.data?.baseUri : undefined) ?? retrievalUri
            indexBundle(child, node['x-ext-urls'], nestedBase, retrievalUri)
          } else if (retrievalUri) {
            stack.push(child)
          }
        }
      }
    }
  }

  indexBundle(documents, mappings, baseUri)
  return origins
}

/**
 * Bundle API descriptions once, retaining AsyncAPI and upgrading compatible OpenAPI input.
 *
 * An object input is never modified; the returned document is built from a copy of it.
 */
export const processDocument = async (
  document: string | Record<string, unknown> | undefined,
  origin?: string,
): Promise<ProcessedDocument> => {
  if (isPluginDocument(document)) {
    throw new Error('Plugin documents are not supported by the mock server')
  }

  // Handle empty/undefined input gracefully
  if (!document || (typeof document === 'object' && Object.keys(document).length === 0)) {
    // Return a minimal valid OpenAPI 3.2 document
    return {
      type: 'openapi',
      serverRetrievalUris: new WeakMap(),
      document: {
        openapi: '3.2.0',
        info: {
          title: 'Mock API',
          version: '1.0.0',
        },
        paths: {},
      },
    }
  }

  let bundled: unknown

  // Confine local file `$ref`s to the document's own directory (or the working directory when the
  // document is an object or inline string), and refuse to fetch private or internal addresses.
  // Without these guards a `$ref` could read arbitrary local files or reach internal services.
  const source = origin ?? document
  const basePath = typeof source === 'string' && isFilePath(source) ? path.dirname(path.resolve(source)) : cwd()

  try {
    // Bundle external references with Node.js plugins
    // Include parseJson and parseYaml to handle string inputs
    // Bundling writes external documents and their URL mappings, so copy object inputs first.
    bundled = await bundle(typeof document === 'string' ? document : cloneDocument(document), {
      origin,
      plugins: [
        openApiDocument(),
        parseJson(),
        parseYaml(),
        readFiles({ basePath }),
        fetchUrls({ blockPrivateNetworks: true }),
      ],
      treeShake: false,
      urlMap: true,
    })
  } catch (error) {
    throw new Error(`Failed to bundle API document: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (!isObjectLike(bundled)) {
    throw new Error('Bundled document is invalid: expected an object')
  }

  if (isPluginDocument(bundled)) {
    throw new Error('Plugin documents are not supported by the mock server')
  }

  // Keep retrieval metadata out of the exported API description.
  const externalDocumentUrls = bundled['x-ext-urls']
  delete bundled['x-ext-urls']

  if (isAsyncApiDocument(bundled)) {
    return { type: 'asyncapi', document: createMagicProxy(bundled) as AsyncApiDocument }
  }

  // Upgrading must not activate a $self field authored in an older OpenAPI version.
  const retrievalUri =
    origin ?? (typeof document === 'string' && (isFilePath(document) || isHttpUrl(document)) ? document : '/')
  const documentUri = resolveOpenApiDocument(bundled, retrievalUri)?.baseUri

  const swaggerVersion = typeof bundled.swagger === 'string' ? bundled.swagger : undefined
  const originalOpenapiVersion = typeof bundled.openapi === 'string' ? bundled.openapi : swaggerVersion
  let upgraded: OpenAPIV3_1.Document | OpenAPIV3_2.Document

  try {
    upgraded = upgrade(bundled, '3.2', { onIncompatible: 'collect' }).document
  } catch (error) {
    throw new Error(
      `Failed to upgrade OpenAPI document to 3.2: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  if (!upgraded) {
    throw new Error('Upgraded document is invalid: upgrade returned null or undefined')
  }

  // Wrap the document in a magic proxy so internal references resolve lazily via `$ref-value`.
  // External references were already pulled inline by `bundle` above, so only local `$ref`s remain.
  return {
    type: 'openapi',
    document: createMagicProxy(upgraded, { documentUri }),
    originalOpenapiVersion,
    retrievalUri,
    serverRetrievalUris: indexServerRetrievalUris(upgraded['x-ext'], externalDocumentUrls, documentUri ?? retrievalUri),
  }
}
