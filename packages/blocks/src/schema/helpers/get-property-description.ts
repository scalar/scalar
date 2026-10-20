import type { ApiReferenceTranslationKey } from '@scalar/types/api-reference'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { isSchema } from '@scalar/workspace-store/schemas/v3.2/strict/type-guards'

type SchemaTranslationKey = Extract<ApiReferenceTranslationKey, `schema.${string}`>

// Type descriptions for built-in types
const TYPE_DESCRIPTIONS: Record<string, Record<string, SchemaTranslationKey>> = {
  integer: {
    _default: 'schema.typeInteger',
    int32: 'schema.formatInt32',
    int64: 'schema.formatInt64',
  },
  string: {
    'date': 'schema.formatDate',
    'date-time': 'schema.formatDateTime',
    'password': 'schema.formatPassword',
    'base64': 'schema.formatBase64',
    'byte': 'schema.formatBase64',
    'binary': 'schema.formatBinary',
  },
} as const

/**
 * Get the translation key of the property description from type/format
 *
 * @param value - The schema object to generate description from
 * @returns Translation key or null if no description available
 */
export const getPropertyDescriptionKey = (value: SchemaObject | undefined): SchemaTranslationKey | null => {
  if (!isSchema(value)) {
    return null
  }
  /** Just grab the first type from the array if it's an array */
  const type = Array.isArray(value.type) ? value.type[0] : value.type
  if (!type) {
    return null
  }

  const typeDescriptions = TYPE_DESCRIPTIONS[type]
  if (!typeDescriptions) {
    return null
  }

  const format =
    ('format' in value && value.format) || ('contentEncoding' in value && value.contentEncoding) || '_default'
  return typeDescriptions[format] ?? null
}
