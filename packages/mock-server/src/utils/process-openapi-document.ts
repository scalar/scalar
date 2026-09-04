import path from 'node:path'
import { cwd } from 'node:process'

import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls, parseJson, parseYaml, readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { isFilePath } from '@scalar/json-magic/helpers/is-file-path'
import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { upgrade } from '@scalar/openapi-upgrader'

/**
 * Processes an OpenAPI document by bundling external references, upgrading to OpenAPI 3.1,
 * and wrapping it so internal references stay intact but resolve lazily.
 *
 * Unlike a full dereference, the returned document keeps `$ref` nodes in place. Consumers
 * resolve them on demand with `getResolvedRef` from `@scalar/workspace-store`, which reads the
 * `$ref-value` exposed by the magic proxy. This avoids eagerly flattening (and duplicating)
 * the whole document up front.
 *
 * @param document - The OpenAPI document to process. Can be a string (URL/path) or an object.
 * @returns A promise that resolves to the OpenAPI 3.1 document with lazily resolvable references.
 * @throws Error if the document cannot be processed or is invalid.
 */
export async function processOpenApiDocument(
  document: string | Record<string, any> | undefined,
): Promise<OpenAPIV3_1.Document> {
  // Handle empty/undefined input gracefully
  if (!document || (typeof document === 'object' && Object.keys(document).length === 0)) {
    // Return a minimal valid OpenAPI 3.1 document
    return {
      openapi: '3.1.0',
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
  const basePath = typeof document === 'string' && isFilePath(document) ? path.dirname(path.resolve(document)) : cwd()

  try {
    // Bundle external references with Node.js plugins
    // Include parseJson and parseYaml to handle string inputs
    bundled = await bundle(document, {
      plugins: [parseJson(), parseYaml(), readFiles({ basePath }), fetchUrls({ blockPrivateNetworks: true })],
      treeShake: false,
    })
  } catch (error) {
    throw new Error(`Failed to bundle OpenAPI document: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (!bundled || typeof bundled !== 'object') {
    throw new Error('Bundled document is invalid: expected an object')
  }

  let upgraded: OpenAPIV3_1.Document

  try {
    // Upgrade to OpenAPI 3.1
    upgraded = upgrade(bundled, '3.1')
  } catch (error) {
    throw new Error(
      `Failed to upgrade OpenAPI document to 3.1: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  if (!upgraded) {
    throw new Error('Upgraded document is invalid: upgrade returned null or undefined')
  }

  // Wrap the document in a magic proxy so internal references resolve lazily via `$ref-value`.
  // External references were already pulled inline by `bundle` above, so only local `$ref`s remain.
  return createMagicProxy(upgraded) as OpenAPIV3_1.Document
}
