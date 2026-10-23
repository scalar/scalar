import { isObject } from '@scalar/helpers/object/is-object'
import { resolveAsyncApiSchema } from '@scalar/workspace-store/helpers/resolve-async-api-schema'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** The same protocol field can have different meanings at each binding location. */
export type BindingScope = 'server' | 'channel' | 'operation' | 'message'

// Schema fields defined by https://github.com/asyncapi/bindings.
const schemaFields: Record<string, Partial<Record<BindingScope, readonly string[]>>> = {
  mqtt: {
    server: ['sessionExpiryInterval', 'maximumPacketSize'],
    operation: ['messageExpiryInterval'],
    message: ['correlationData', 'responseTopic'],
  },
  kafka: { operation: ['groupId', 'clientId'], message: ['key'] },
  ws: { channel: ['query', 'headers'] },
  http: { operation: ['query'], message: ['headers'] },
}

const schemaTypes = new Set(['null', 'boolean', 'object', 'array', 'number', 'integer', 'string'])

/** A rendering heuristic for schemas in custom fields, not schema validation. */
const looksLikeSchema = (value: Record<string, unknown>): boolean => {
  if ('schemaFormat' in value) {
    return isObject(value.schema) || typeof value.schema === 'boolean'
  }
  if ('type' in value) {
    return typeof value.type === 'string'
      ? schemaTypes.has(value.type)
      : Array.isArray(value.type) && value.type.length > 0 && value.type.every((type) => schemaTypes.has(type))
  }
  if (isObject(value.properties)) {
    return Object.values(value.properties).every((property) => isObject(property) || typeof property === 'boolean')
  }
  if (isObject(value.items) || typeof value.items === 'boolean') {
    return true
  }
  return ['allOf', 'anyOf', 'oneOf'].some((keyword) => {
    const members = value[keyword]
    return (
      Array.isArray(members) &&
      members.length > 0 &&
      members.every((member) => isObject(member) || typeof member === 'boolean')
    )
  })
}

/** Use protocol metadata first, then recognize schema shapes in unlisted binding fields. */
export const getBindingSchema = (
  protocol: string,
  scope: BindingScope | undefined,
  field: string,
  value: unknown,
): SchemaObject | undefined => {
  const documentedSchema = Boolean(scope && schemaFields[protocol]?.[scope]?.includes(field))
  // Booleans in arbitrary settings are values, but documented schema positions can use them.
  if (typeof value === 'boolean' && documentedSchema) {
    const resolved = resolveAsyncApiSchema(value)
    return resolved?.kind === 'schema' ? resolved.schema : undefined
  }
  if (!isObject(value) || '$ref' in value) {
    return undefined
  }
  // Extension data is opaque; unfamiliar fields need positive schema evidence.
  if (!documentedSchema && (field.startsWith('x-') || !looksLikeSchema(value))) {
    return undefined
  }
  // Avro and other schema languages can use type names the JSON Schema renderer cannot represent.
  if (typeof value.type === 'string' && !schemaTypes.has(value.type)) {
    return undefined
  }
  const resolved = resolveAsyncApiSchema(value)
  return resolved?.kind === 'schema' ? resolved.schema : undefined
}
