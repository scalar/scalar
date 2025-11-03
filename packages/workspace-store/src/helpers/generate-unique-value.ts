/**
 * Generate a unique value
 *
 * We first try to see if we can use the default value by first running a transformation function on it
 * If we can not generate a unique value using that we try to incrementally apply a random salt at the end
 *
 * Try to slugify the value and check it against the validation function to see if the value is unique
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
   * */
  defaultValue: string
  /** Validate if the new generated value is unique */
  validation: (value: string) => Promise<boolean> | boolean
  /** Transform the default value to get a new value which will match the schema of the value we need to derive */
  transformation?: (value: string) => string
  maxRetries: number
}) {
  const slugified = transformation?.(defaultValue) ?? defaultValue

  if (validation(slugified)) {
    return slugified
  }

  return incrementValue({
    value: [slugified, 1],
    validation,
    maxRetries,
  })
}

/**
 * Attempt to increment the value by adding a random salt to the end
 * and checking if it is available.
 *
 * If the value is not available, we try again.
 *
 * If the value is available, we return it.
 *
 * If we can not generate a unique value more than the threshold we simply throw an error
 */
function incrementValue({
  value,
  validation,
  maxRetries,
  attempts = 0,
}: {
  value: [string, number] // [value, attempts]
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
