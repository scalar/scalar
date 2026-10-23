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

/** Only interpret documented schema fields; arbitrary protocol objects remain JSON. */
export const getBindingSchema = (
  protocol: string,
  scope: BindingScope | undefined,
  field: string,
  value: unknown,
): SchemaObject | undefined => {
  if (!scope || !schemaFields[protocol]?.[scope]?.includes(field) || !isObject(value)) {
    return undefined
  }
  // Unresolved references and Avro keys must remain readable as source.
  if (
    '$ref' in value ||
    (protocol === 'kafka' &&
      field === 'key' &&
      typeof value.type === 'string' &&
      !['null', 'boolean', 'object', 'array', 'number', 'integer', 'string'].includes(value.type))
  ) {
    return undefined
  }
  const resolved = resolveAsyncApiSchema(value)
  return resolved?.kind === 'schema' ? resolved.schema : undefined
}
