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
export async function generateUniqueValue({
  defaultValue,
  /** Check function to verify the uniqueness of the value */
  validation,
  /** Transformation function to transform the default value (such as into a slug) */
  transformation,
  /** The maximum number of attempts to create a unique value by incrementing. */
  maxRetries = 5,
}: {
  /**
   * The original value to base the unique generation upon.
   * Example: "workspace", which may end up producing "workspace 2", "workspace 3", etc.
   */
  defaultValue: string

  /**
   * Validation function that determines if a generated value is unique.
   * Should return true if the value is unique; false if not.
   * Can be asynchronous or synchronous.
   */
  validation: (value: string) => Promise<boolean> | boolean

  /**
   * Optional function to transform the default value before attempting uniqueness.
   * Example: Transform "Workspace A" into "workspace-a" to follow a slug schema.
   */
  transformation?: (value: string) => string

  /**
   * The maximum number of attempts to create a unique value by incrementing.
   * For example, if set to 5: "foo", "foo 1", "foo 2", "foo 3", "foo 4" will be attempted.
   */
  maxRetries: number
}) {
  const transformed = transformation?.(defaultValue) ?? defaultValue

  if (await validation(transformed)) {
    return transformed
  }

  return incrementValue({
    value: [transformed, 1],
    validation,
    maxRetries,
    transformation,
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
async function incrementValue({
  value,
  validation,
  maxRetries,
  attempts = 0,
  transformation,
}: {
  /**
   * Tuple containing the base value and the starting increment number.
   * Example: ["workspace", 1] will try "workspace 1", "workspace 2", etc.
   */
  value: [string, number] // [base value, next increment]

  /**
   * Function to validate if the generated value is unique.
   * Should return true if the value is unique, otherwise false.
   * Supports both synchronous and asynchronous operation.
   */
  validation: (value: string) => Promise<boolean> | boolean

  /**
   * The maximum number of retry attempts to generate a unique value.
   * Generation will stop and return undefined if this number is exceeded.
   */
  maxRetries: number

  /**
   * The current attempt count.
   * Used internally for recursion; users should generally omit this field.
   */
  attempts?: number

  /**
   * Optional function to transform the value before passing it to validation.
   * E.g., for slugifying a value for URLs.
   */
  transformation?: (value: string) => string
}) {
  if (attempts >= maxRetries) {
    return
  }

  const incremented = value.join(' ')
  const transformed = transformation?.(incremented) ?? incremented

  if (await validation(transformed)) {
    return transformed
  }

  return incrementValue({
    value: [value[0], value[1] + 1],
    validation,
    maxRetries,
    transformation,
    attempts: attempts + 1,
  })
}
