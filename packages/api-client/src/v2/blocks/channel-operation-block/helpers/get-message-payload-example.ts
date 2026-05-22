import { isObject } from '@scalar/helpers/object/is-object'
import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { getExampleFromSchema } from '@scalar/workspace-store/request-example'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

const isJsonSchema = (value: unknown): value is SchemaObject =>
  isObject(value) && ('type' in value || 'properties' in value || '$ref' in value)

/**
 * Builds a JSON string sample for the message payload editor from schema or examples.
 */
export const getMessagePayloadExample = (message: AsyncApiMessageObject): string => {
  const payload = message.payload

  if (payload == null) {
    return '{}'
  }

  if (isObject(payload) && 'example' in payload && payload.example != null) {
    return JSON.stringify(payload.example, null, 2)
  }

  if (isJsonSchema(payload)) {
    const example = getExampleFromSchema(payload)
    return JSON.stringify(example, null, 2)
  }

  return JSON.stringify(payload, null, 2)
}
