/**
 * Set of dangerous keys that can be used for prototype pollution attacks.
 * These keys should never be used as property names in dynamic object operations.
 */
const PROTOTYPE_POLLUTION_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

/**
 * Validates that a key is safe to use and does not pose a prototype pollution risk.
 * Throws an error if a dangerous key is detected.
 *
 * @param key - The key to validate
 * @param context - Optional context string to help identify where the validation failed
 * @throws {Error} If the key matches a known prototype pollution vector
 *
 * @example
 * ```ts
 * preventPollution('__proto__') // throws Error
 * preventPollution('safeName') // passes
 * preventPollution('constructor', 'operation update') // throws Error with context
 * ```
 */
export const preventPollution = (key: string, context?: string): void => {
  if (PROTOTYPE_POLLUTION_KEYS.has(key)) {
    const errorMessage = context
      ? `Prototype pollution key detected: "${key}" in ${context}`
      : `Prototype pollution key detected: "${key}"`

    throw new Error(errorMessage)
  }
}
