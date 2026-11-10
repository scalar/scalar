import path from 'node:path'
import { cwd } from 'node:process'

import { isObjectLike } from '@scalar/helpers/object/is-object'
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls, parseJson, parseYaml, readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { isFilePath } from '@scalar/json-magic/helpers/is-file-path'
import { isHttpUrl } from '@scalar/json-magic/helpers/is-http-url'
import { createMagicProxy } from '@scalar/json-magic/magic-proxy'
import type { OpenAPIV3_1, OpenAPIV3_2 } from '@scalar/openapi-types'
import { upgrade } from '@scalar/openapi-upgrader'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { openApiDocument, resolveOpenApiDocument } from '@scalar/workspace-store/plugins/bundler'

import { cloneDocument } from '@/utils/clone-document'

/** A processed API description, tagged so each mock engine receives its own document type. */
export type ProcessedDocument =
  | { type: 'openapi'; document: OpenAPIV3_1.Document | OpenAPIV3_2.Document }
  | { type: 'asyncapi'; document: AsyncApiDocument }

/**
 * Bundle API descriptions once, retaining AsyncAPI and upgrading compatible OpenAPI input.
 *
 * An object input is never modified; the returned document is built from a copy of it.
 */
export const processDocument = async (
  document: string | Record<string, unknown> | undefined,
  origin?: string,
): Promise<ProcessedDocument> => {
  // Handle empty/undefined input gracefully
  if (!document || (typeof document === 'object' && Object.keys(document).length === 0)) {
    // Return a minimal valid OpenAPI 3.2 document
    return {
      type: 'openapi',
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
    // `bundle` edits the object it is handed — it records external documents under `x-ext` and drops
    // `x-ext-urls` — so an object input is copied first and the caller's document is left as passed.
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
    })
  } catch (error) {
    throw new Error(`Failed to bundle API document: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (!isObjectLike(bundled)) {
    throw new Error('Bundled document is invalid: expected an object')
  }

  if ('asyncapi' in bundled) {
    return { type: 'asyncapi', document: createMagicProxy(bundled) as AsyncApiDocument }
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
  return { type: 'openapi', document: createMagicProxy(upgraded, { documentUri }) }
}
