import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isSchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

// Type descriptions for built-in types
const TYPE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  integer: {
    _default: 'Integer numbers.',
    int32: 'Signed 32-bit integers (commonly used integer type).',
    int64: 'Signed 64-bit integers (long type).',
  },
  string: {
    'date': 'full-date notation as defined by RFC 3339, section 5.6, for example, 2017-07-21',
    'date-time': 'the date-time notation as defined by RFC 3339, section 5.6, for example, 2017-07-21T17:32:28Z',
    'password': 'a hint to UIs to mask the input',
    'base64': 'base64-encoded characters, for example, U3dhZ2dlciByb2Nrcw==',
    'byte': 'base64-encoded characters, for example, U3dhZ2dlciByb2Nrcw==',
    'binary': 'binary data, used to describe files',
  },
} as const

/**
 * Generate property description from type/format
 *
 * @param value - The schema object to generate description from
 * @returns Description string or null if no description available
 */
export const getPropertyDescription = (value: SchemaObject | undefined): string | null => {
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
