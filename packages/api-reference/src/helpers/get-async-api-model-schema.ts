import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { unwrapAsyncApiSchema } from './get-async-api-message-payload-schema'

/**
 * Resolves a named schema from an AsyncAPI document's `components.schemas` into the `SchemaObject`
 * shape the shared OpenAPI Model components and search indexing expect.
 *
 * AsyncAPI keeps reusable schemas in the same place OpenAPI does, but an entry may need extra handling:
 * - `components` or the schema itself may be a `$ref`; reference siblings are ignored.
 * - A Multi Format Schema Object (`schemaFormat` plus a nested `schema`) is unwrapped to its payload,
 *   so we index and render the inner JSON Schema rather than the wrapper.
 * - Boolean schemas are adapted for display; other schema formats are handled by source rendering.
 */
export const getAsyncApiModelSchema = (document: AsyncApiDocument, name: string): SchemaObject | undefined => {
  if (!document.components) {
    return undefined
  }

  // Resolve the components wrapper without treating siblings as additional schemas.
  const components = getResolvedAsyncApiRef(document.components)
  const entry = components?.schemas?.[name]

  // Resolve `$ref`s and unwrap Multi Format Schema Objects into the plain JSON Schema shape.
  return unwrapAsyncApiSchema(entry)
}
