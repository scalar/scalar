import { coerceValue } from '@/schemas/typebox-coerce'
import { type SchemaObject, SchemaObjectSchema } from '@/schemas/v3.2/strict/openapi-document'

import { serializeXmlExample } from './get-xml-example'

/**
 * Serialize structured XML part data through the shared schema-aware writer.
 * A part must contain a complete XML document, so mapping errors reject serialization.
 * Already serialized strings bypass this boundary in request builders.
 */
export const serializeXmlPart = (value: Record<string, unknown>, schema?: SchemaObject): string => {
  const result = serializeXmlExample(value, schema ?? coerceValue(SchemaObjectSchema, {}), {
    mode: 'write',
    rootName: 'root',
  })
  if (result.xml === undefined) {
    throw new Error(`Unable to serialize XML part: ${result.diagnostics.map(({ code }) => code).join(', ')}`)
  }
  return result.xml
}
