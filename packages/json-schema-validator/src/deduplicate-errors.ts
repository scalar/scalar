import type { ErrorObject } from '@/types'

/**
 * Removes errors that share the same message and path.
 *
 * The `path` may be a JSON Pointer string (schema errors) or a list of segments
 * (semantic errors), so both shapes are normalized to the same key.
 */
export function deduplicateErrors(errors: ErrorObject[]): ErrorObject[] {
  const seen = new Set<string>()

  return errors.filter((error) => {
    const pathKey = Array.isArray(error.path) ? error.path.join('.') : (error.path ?? '')
    const key = `${error.message}||${pathKey}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)

    return true
  })
}
