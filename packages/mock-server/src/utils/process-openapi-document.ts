import { bundle } from '@scalar/json-magic/bundle'
import { parseJson } from '@scalar/json-magic/bundle/plugins/node'
import { parseYaml } from '@scalar/json-magic/bundle/plugins/node'
import { readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/node'
import { dereference } from '@scalar/openapi-parser'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { upgrade } from '@scalar/openapi-upgrader'

/**
 * Processes an OpenAPI document by bundling external references, upgrading to OpenAPI 3.1,
 * and dereferencing the document.
 *
 * @param document - The OpenAPI document to process. Can be a string (URL/path) or an object.
 * @returns A promise that resolves to the dereferenced OpenAPI 3.1 document.
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

  try {
    // Bundle external references with Node.js plugins
    // Include parseJson and parseYaml to handle string inputs
    bundled = await bundle(document, {
      plugins: [parseJson(), parseYaml(), readFiles(), fetchUrls()],
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

  // Dereference the document
  const dereferenceResult = dereference(upgraded)

  // Check for dereference errors
  if (dereferenceResult.errors && dereferenceResult.errors.length > 0) {
    const errorMessages = dereferenceResult.errors.map((err) => err.message).join(', ')
    throw new Error(`Failed to dereference OpenAPI document: ${errorMessages}`)
  }

  // Extract the schema from the dereference result
  const schema = dereferenceResult.schema

  if (!schema) {
    throw new Error('Dereference result does not contain a schema')
  }

  // Ensure the schema is a valid OpenAPI 3.1 document
  if (typeof schema !== 'object') {
    throw new Error('Dereferenced schema is invalid: expected an object')
  }

  return schema as OpenAPIV3_1.Document
}
