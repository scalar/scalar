/**
 * Generates a unique string value based on a default value and a validation function.
 * The function tries the default value first. If validation fails, it appends
 * an incrementing suffix (optionally with a prefix) until the validation passes.
 *
 * @param defaultValue - The initial base string value to try.
 * @param validation - A function that receives a candidate value and returns true if it is valid.
 * @param prefix - Optional prefix to add before the incrementing number (default is '').
 * @returns The first value that passes the validation.
 *
 * @example
 * // Case 1: Simple unused value
 * generateUniqueValue('example', v => v !== 'example') // → "example 2"
 *
 * // Case 2: Avoids taken values in a set
 * const taken = new Set(['foo', 'foo 1', 'foo 2']);
 * generateUniqueValue('foo', v => !taken.has(v)) // → "foo 3"
 *
 * // Case 3: Using a prefix
 * generateUniqueValue('base', v => v === 'base__3', '__') // → "base__3"
 */
export const generateUniqueValue = (
  defaultValue: string,
  validation: (value: string) => boolean,
  prefix = '',
): string => {
  let i = 1
  let value = defaultValue
  while (!validation(value)) {
    value = `${defaultValue} ${prefix}${i++}`
  }
  return value
}
