import { isObject } from '@/utils/is-object'

/**
 * Determines if a string represents a valid JSON object (i.e., a plain object, not an array, primitive, or null).
 * The function first checks if the string appears to start with an opening curly brace (ignoring leading whitespace),
 * which is a quick heuristic to rule out arrays, primitives, and most invalid JSON. If this check passes,
 * it attempts to parse the string with JSON.parse. The result is then checked to ensure it is a plain object
 * (not an array, null, or primitive) using the isObject utility.
 *
 * @param value - The string to evaluate
 * @returns true if the string is valid JSON and parses to a plain object, false otherwise
 *
 * @example
 * isJsonObject('{"foo": "bar"}') // true
 * isJsonObject('[1,2,3]') // false
 * isJsonObject('not json') // false
 * isJsonObject('42') // false
 */
export function isJsonObject(value: string) {
  // Quickly rule out anything that doesn't start with an object brace
  if (!/^\s*(\{)/.test(value.slice(0, 500))) {
    return false
  }

  try {
    const val = JSON.parse(value)
    return isObject(val)
  } catch {
    return false
  }
}
