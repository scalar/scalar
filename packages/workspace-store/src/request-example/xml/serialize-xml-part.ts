import { json2xml } from '@scalar/helpers/file/json2xml'

import { unpackProxyObject } from '@/helpers/unpack-proxy'
import type { SchemaObject } from '@/schemas/v3.2/strict/openapi-document'

/**
 * Serialize structured XML part data through a single request boundary.
 * TODO: Delegate to the schema-aware XML serializer when it is integrated.
 * Preserve the legacy root-name contract at this boundary.
 * Already serialized XML strings bypass this adapter in the multipart builder.
 */
export const serializeXmlPart = (value: Record<string, unknown>, schema?: SchemaObject): string => {
  const rootName = schema?.xml?.name ?? 'root'
  return json2xml({ [rootName]: unpackProxyObject(value) })
}
