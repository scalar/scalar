/**
 * Generates a unique value based on a given default value and a validation function.
 *
 * The process works as follows:
 * 1. Optionally transform (e.g., slugify) the default value using a transformation function.
 * 2. Check if this value is unique by executing the provided validation function.
 * 3. If not unique, repeatedly append an incrementing integer (e.g., "my-name 1", "my-name 2", ...) and re-check uniqueness,
 *    up to a maximum number of attempts (maxRetries).
 * 4. Returns the first unique value found or undefined if a unique value cannot be generated within the maximum retries.
 *
 * Example:
 * ```ts
 * // Existing names in use
 * const existing = new Set(['foo', 'foo 1', 'foo 2']);
 * const uniqueName = generateUniqueValue({
 *   defaultValue: 'foo',
 *   validation: (value) => !existing.has(value),
 *   // transformation is optional, e.g. (val) => val.toLowerCase().replace(/[^\w]+/g, '-'),
 *   maxRetries: 10,
 * });
 * // uniqueName === 'foo 3'
 * ```
 */
export function generateUniqueValue({
  defaultValue,
  /** Check function to verify the uniqueness of the value */
  validation,
  /** Transformation function to transform the default value (such as into a slug) */
  transformation,
  maxRetries = 5,
}: {
  /**
   * Value which will be used to derive a new unique value.
   */
  defaultValue: string
  /** Validate if the new generated value is unique */
  validation: (value: string) => Promise<boolean> | boolean
  /** Transform the default value to get a new value which will match the schema of the value we need to derive */
  transformation?: (value: string) => string
  /** The maximum number of retry attempts to generate a unique value. */
  maxRetries: number
}) {
  const transformed = transformation?.(defaultValue) ?? defaultValue

  if (validation(transformed)) {
    return transformed
  }

  return incrementValue({
    value: [transformed, 1],
    validation,
    maxRetries,
  })
}

/**
 * Attempts to generate a unique value by appending and incrementing a counter to a base string.
 *
 * On each attempt, appends the next incrementing integer (e.g. "foo 1", "foo 2", etc.) to the original value,
 * and checks with the validation function whether the candidate value is unique.
 *
 * Continues until a unique value is found, or the maximum number of attempts is reached.
 *
 * Returns the first unique value found, or undefined if a unique value cannot be generated within maxRetries.
 *
 * Example:
 * ```ts
 * const existing = new Set(['bar', 'bar 1']);
 * const result = incrementValue({
 *   value: ['bar', 1],
 *   validation: (val) => !existing.has(val),
 *   maxRetries: 5,
 * });
 * // result === "bar 2"
 * ```
 */
function incrementValue({
  value,
  validation,
  maxRetries,
  attempts = 0,
}: {
  value: [string, number] // [base value, next increment]
  validation: (value: string) => Promise<boolean> | boolean
  maxRetries: number
  attempts?: number
}) {
  if (attempts >= maxRetries) {
    return
  }

  const incremented = value.join(' ')

  if (validation(incremented)) {
    return incremented
  }

  return incrementValue({
    value: [value[0], value[1] + 1],
    validation,
    maxRetries,
    attempts: attempts + 1,
  })
}
