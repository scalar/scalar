import { isObject } from '@scalar/helpers/object/is-object'
import { getBooleanSchema } from '@scalar/workspace-store/helpers/get-boolean-schema'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

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
  const resolved = getResolvedRef(value)
  const wrapped = isObject(resolved) && 'schemaFormat' in resolved
  const schema = wrapped ? getResolvedRef(resolved.schema) : resolved
  if (schema === undefined) {
    return undefined
  }
  if (wrapped && !isAsyncApiJsonSchemaFormat(resolved.schemaFormat)) {
    return { kind: 'source', format: String(resolved.schemaFormat), value: schema }
  }
  if (typeof schema === 'boolean') {
    return { kind: 'schema', schema: getBooleanSchema(schema) }
  }
  // AsyncAPI and OpenAPI schemas share the object renderer, whose type requires a `type` field.
  return isObject(schema) ? { kind: 'schema', schema: schema as SchemaObject } : undefined
}
