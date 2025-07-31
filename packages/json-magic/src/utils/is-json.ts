/**
 * Checks if a string is valid JSON.
 * This function attempts to parse the input string using JSON.parse.
 * If parsing succeeds, it returns true; otherwise, it returns false.
 *
 * @param value - The string to check
 * @returns true if the string is valid JSON, false otherwise
 *
 * @example
 * isJson('{"foo": "bar"}') // true
 * isJson('not json') // false
 */
export function isJson(value: string) {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}
