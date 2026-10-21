import { isObject } from '@scalar/helpers/object/is-object'

import type { SchemaObject } from '../schemas/v3.2/strict/openapi-document'
import { getAsyncApiSchemaView } from './get-async-api-schema-view'
import { getBooleanSchema } from './get-boolean-schema'
import { getResolvedAsyncApiRef } from './get-resolved-async-api-ref'

/** Keep non-JSON schema languages out of JSON Schema rendering and traversal. */
export const isAsyncApiJsonSchemaFormat = (format: unknown): boolean => {
  if (format === undefined) {
    return true
  }
  if (typeof format !== 'string') {
    return false
  }
  const mediaType = format.split(';')[0]?.trim().toLowerCase()
  return [
    'application/schema+json',
    'application/schema+yaml',
    'application/vnd.aai.asyncapi',
    'application/vnd.aai.asyncapi+json',
    'application/vnd.aai.asyncapi+yaml',
    'application/vnd.oai.openapi',
    'application/vnd.oai.openapi+json',
    'application/vnd.oai.openapi+yaml',
  ].includes(mediaType ?? '')
}

/** A schema that can use the shared renderer, or source in another schema language. */
type AsyncApiSchema = { kind: 'schema'; schema: SchemaObject } | { kind: 'source'; format: string; value: unknown }

/** Resolve the wrapper and its schema without discarding the declared schema language. */
export const resolveAsyncApiSchema = (value: unknown): AsyncApiSchema | undefined => {
  const resolved = getResolvedAsyncApiRef(value)
  const wrapped = isObject(resolved) && 'schemaFormat' in resolved
  const schema = wrapped ? getResolvedAsyncApiRef(resolved.schema) : resolved
  if (schema === undefined) {
    return undefined
  }
  if (wrapped && !isAsyncApiJsonSchemaFormat(resolved.schemaFormat)) {
    return { kind: 'source', format: String(resolved.schemaFormat), value: schema }
  }
  if (typeof schema === 'boolean') {
    return { kind: 'schema', schema: getBooleanSchema(schema) }
  }
  const view = getAsyncApiSchemaView(schema, wrapped ? String(resolved.schemaFormat) : undefined)
  // AsyncAPI and OpenAPI schemas share the object renderer, whose type requires a `type` field.
  return isObject(view) ? { kind: 'schema', schema: view as SchemaObject } : undefined
}
