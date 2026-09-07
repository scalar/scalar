import path from 'node:path'
import { cwd } from 'node:process'

import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls, parseJson, parseYaml, readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { isFilePath } from '@scalar/json-magic/helpers/is-file-path'
import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'

/**
 * Processes an AsyncAPI document by bundling external references and wrapping it so internal
 * references stay intact but resolve lazily — the AsyncAPI counterpart of
 * {@link processOpenApiDocument}.
 *
 * Unlike a full dereference, the returned document keeps `$ref` nodes in place. Consumers resolve
 * them on demand with `getResolvedRef` from `@scalar/workspace-store`, which reads the `$ref-value`
 * exposed by the magic proxy. This avoids eagerly flattening (and duplicating) the whole document.
 *
 * Only AsyncAPI 3.1 is supported; 2.x documents should be upgraded before being passed in.
 *
 * @param document - The AsyncAPI document to process. Can be a string (URL/path) or an object.
 * @returns A promise that resolves to the AsyncAPI document with lazily resolvable references.
 * @throws Error if the document cannot be processed or is invalid.
 */
export async function processAsyncApiDocument(
  document: string | Record<string, any> | undefined,
): Promise<AsyncApiDocument> {
  // Handle empty/undefined input gracefully with a minimal valid document.
  if (!document || (typeof document === 'object' && Object.keys(document).length === 0)) {
    return {
      asyncapi: '3.1.0',
      info: {
        title: 'Mock API',
        version: '1.0.0',
      },
      channels: {},
      operations: {},
    } as AsyncApiDocument
  }

  let bundled: Record<string, any>

  // Confine local file `$ref`s to the document's own directory (or the working directory when the
  // document is an object or inline string), and refuse to fetch private or internal addresses.
  // Without these guards a `$ref` could read arbitrary local files or reach internal services.
  const basePath = typeof document === 'string' && isFilePath(document) ? path.dirname(path.resolve(document)) : cwd()

  try {
    // Bundle external references; parse string inputs (JSON or YAML) along the way.
    bundled = await bundle(document, {
      plugins: [parseJson(), parseYaml(), readFiles({ basePath }), fetchUrls({ blockPrivateNetworks: true })],
      treeShake: false,
    })
  } catch (error) {
    throw new Error(`Failed to bundle AsyncAPI document: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (!bundled || typeof bundled !== 'object') {
    throw new Error('Bundled document is invalid: expected an object')
  }

  // Wrap the document in a magic proxy so internal references resolve lazily via `$ref-value`.
  // External references were already pulled inline by `bundle` above, so only local `$ref`s remain.
  return createMagicProxy(bundled) as AsyncApiDocument
}

/**
 * Detects whether a loaded document describes an AsyncAPI API (rather than OpenAPI/Swagger).
 * Used to route an incoming document to the right mock engine.
 */
export function isAsyncApiDocument(document: unknown): boolean {
  return typeof document === 'object' && document !== null && 'asyncapi' in document
}
