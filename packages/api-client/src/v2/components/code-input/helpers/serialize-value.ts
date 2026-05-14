import type { CodeInputModelValue } from '../CodeInput.vue'

/**
 * Convert any model value to a string suitable for the editor's serialized form.
 *
 * Strings pass through untouched, nullish values become an empty string, and
 * everything else is JSON-stringified so booleans, numbers, arrays, and
 * objects round-trip predictably through the editor.
 */
export const serializeValue = (value: CodeInputModelValue): string => {
  if (typeof value === 'string') {
    return value
  }
  if (value == null) {
    return ''
  }
  return JSON.stringify(value)
}
