import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'

/**
 * Flattens default values for display purposes.
 *
 * Handles special cases like null values, single-item arrays, and string formatting.
 */
export const flattenDefaultValue = (value: SchemaObject): string | number | boolean | null => {
  if (value?.default === null) {
    return 'null'
  }

  if (Array.isArray(value?.default) && value.default.length === 1) {
    return value.default[0]
  }

  if (typeof value?.default === 'string') {
    return JSON.stringify(value.default)
  }

  if (Array.isArray(value?.default)) {
    return JSON.stringify(value.default)
  }

  return value?.default
}
