import { isObject } from '@scalar/helpers/object/is-object'
import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { getBooleanSchema } from '@scalar/workspace-store/helpers/get-boolean-schema'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/**
 * A resolved schema-bearing value may be a JSON Schema object, a boolean (`true`/`false`)
 * schema, or a Multi Format Schema wrapper. Object schemas already have the shape the shared
 * Schema/Model rendering expects.
 */
const isSchemaObject = (value: unknown): value is SchemaObject => isObject(value)

/**
 * Unwraps an AsyncAPI schema-bearing value into the `SchemaObject` shape the shared OpenAPI
 * `Schema`/`Model` components expect.
 *
 * AsyncAPI reuses JSON Schema, but a value may need extra handling:
 * - The value itself may be a `$ref`; it is resolved to its `$ref-value`.
 * - A Multi Format Schema Object (`schemaFormat` plus a nested `schema`) is unwrapped to its
 *   payload, so we render the inner JSON Schema rather than the wrapper.
 * - Boolean schemas are represented by equivalent object schemas with an explanation.
 * - Non-JSON-Schema primitives are skipped.
 */
export const unwrapAsyncApiSchema = (value: unknown): SchemaObject | undefined => {
  if (value === undefined) {
    return undefined
  }

  // Resolve the value the same way OpenAPI model rendering does (plain `$ref-value`).
  const resolved = getResolvedRef(value)

  // Multi Format Schema Objects carry the real schema under `schema`; unwrap to that payload.
  const schema = isObject(resolved) && 'schemaFormat' in resolved ? getResolvedRef(resolved.schema) : resolved

  return typeof schema === 'boolean' ? getBooleanSchema(schema) : isSchemaObject(schema) ? schema : undefined
}

/** Resolves an AsyncAPI message `payload` into the `SchemaObject` the shared Schema component expects. */
export const getAsyncApiMessagePayloadSchema = (message: AsyncApiMessageObject): SchemaObject | undefined =>
  unwrapAsyncApiSchema(message.payload)

/** Resolves an AsyncAPI message `headers` into the `SchemaObject` the shared Schema component expects. */
export const getAsyncApiMessageHeadersSchema = (message: AsyncApiMessageObject): SchemaObject | undefined =>
  unwrapAsyncApiSchema(message.headers)
