import { isObject } from '@scalar/helpers/object/is-object'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * A resolved `components.schemas` entry may be a JSON Schema object, a boolean (`true`/`false`)
 * schema, or a Multi Format Schema wrapper, so accept only plain objects and treat them as the
 * `SchemaObject` the shared Model rendering and search helpers expect.
 */
const isSchemaObject = (value: unknown): value is SchemaObject => isObject(value)

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
  if (entry === undefined) {
    return undefined
  }

  // Resolve the schema itself the same way OpenAPI model rendering does (plain `$ref-value`).
  const resolved = getResolvedRef(entry)

  // Multi Format Schema Objects carry the real schema under `schema`; unwrap to that payload.
  const schema = isObject(resolved) && 'schemaFormat' in resolved ? getResolvedRef(resolved.schema) : resolved

  return isSchemaObject(schema) ? schema : undefined
}
