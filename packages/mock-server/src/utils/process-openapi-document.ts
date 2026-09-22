import path from 'node:path'
import { cwd } from 'node:process'

import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls, parseJson, parseYaml, readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { isFilePath } from '@scalar/json-magic/helpers/is-file-path'
import { isHttpUrl } from '@scalar/json-magic/helpers/is-http-url'
import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import type { OpenAPIV3_1, OpenAPIV3_2 } from '@scalar/openapi-types'
import { upgrade } from '@scalar/openapi-upgrader'
import { openApiDocument, resolveOpenApiDocument } from '@scalar/workspace-store/plugins/bundler'

/**
 * Processes an OpenAPI document by bundling external references, upgrading compatible input to OpenAPI 3.2,
 * and wrapping it so internal references stay intact but resolve lazily.
 *
 * Unlike a full dereference, the returned document keeps `$ref` nodes in place. Consumers
 * resolve them on demand with `getResolvedRef` from `@scalar/workspace-store`, which reads the
 * `$ref-value` exposed by the magic proxy. This avoids eagerly flattening (and duplicating)
 * the whole document up front.
 *
 * Compatibility failures retain the OpenAPI 3.1 document and its version, without applying partial migrations.
 *
 * @param document - The OpenAPI document to process. Can be a string (URL/path) or an object.
 * @param origin - Source file path or URL for resolving references in an already loaded document.
 * @returns A promise that resolves to the document with lazily resolvable references.
 * @throws Error if the document cannot be processed or is invalid.
 */
export async function processOpenApiDocument(
  document: string | Record<string, any> | undefined,
  origin?: string,
): Promise<OpenAPIV3_1.Document | OpenAPIV3_2.Document> {
  // Handle empty/undefined input gracefully
  if (!document || (typeof document === 'object' && Object.keys(document).length === 0)) {
    // Return a minimal valid OpenAPI 3.2 document
    return {
      openapi: '3.2.0',
      info: {
        title: 'Mock API',
        version: '1.0.0',
      },
      paths: {},
    }
  }

  let bundled: Record<string, any>

  // Confine local file `$ref`s to the document's own directory (or the working directory when the
  // document is an object or inline string), and refuse to fetch private or internal addresses.
  // Without these guards a `$ref` could read arbitrary local files or reach internal services.
  const source = origin ?? document
  const basePath = typeof source === 'string' && isFilePath(source) ? path.dirname(path.resolve(source)) : cwd()

  try {
    // Bundle external references with Node.js plugins
    // Include parseJson and parseYaml to handle string inputs
    bundled = await bundle(document, {
      origin,
      plugins: [
        openApiDocument(),
        parseJson(),
        parseYaml(),
        readFiles({ basePath }),
        fetchUrls({ blockPrivateNetworks: true }),
      ],
      treeShake: false,
    })
  } catch (error) {
    throw new Error(`Failed to bundle OpenAPI document: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (!bundled || typeof bundled !== 'object') {
    throw new Error('Bundled document is invalid: expected an object')
  }

  // Upgrading must not activate a $self field authored in an older OpenAPI version.
  const retrievalUri =
    origin ?? (typeof document === 'string' && (isFilePath(document) || isHttpUrl(document)) ? document : '/')
  const documentUri = resolveOpenApiDocument(bundled, retrievalUri)?.baseUri

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
  return createMagicProxy(upgraded, { documentUri })
}
