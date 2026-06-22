import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { unwrapAsyncApiSchema } from './get-async-api-message-payload-schema'

/**
 * Resolves a named schema from an AsyncAPI document's `components.schemas` into the `SchemaObject`
 * shape the shared OpenAPI Model components and search indexing expect.
 *
 * AsyncAPI keeps reusable schemas in the same place OpenAPI does, but an entry may need extra handling:
 * - `components` or the schema itself may be a `$ref`; siblings are merged so keys declared alongside
 *   a `$ref` are kept rather than dropped.
 * - A Multi Format Schema Object (`schemaFormat` plus a nested `schema`) is unwrapped to its payload,
 *   so we index and render the inner JSON Schema rather than the wrapper.
 * - Boolean (`true`/`false`) and non-JSON-Schema payloads are skipped.
 */
export const getAsyncApiModelSchema = (document: AsyncApiDocument, name: string): SchemaObject | undefined => {
  if (!document.components) {
    return undefined
  }

  // Merge siblings at the components level so schemas declared alongside a `$ref` are kept.
  const components = getResolvedRef(document.components, mergeSiblingReferences)
  const entry = components.schemas?.[name]

  // Resolve `$ref`s and unwrap Multi Format Schema Objects into the plain JSON Schema shape.
  return unwrapAsyncApiSchema(entry)
}
