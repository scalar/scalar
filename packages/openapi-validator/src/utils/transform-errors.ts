import type { AnyObject } from '@scalar/types/utils'

import type { ErrorObject } from '@/types'
import { type AjvError, betterAjvErrors } from '@/vendor/better-ajv-errors/index'

/**
 * Transforms raw Ajv errors into enriched, human-friendly error objects.
 *
 * A plain string is passed through as a single error message. Otherwise the Ajv
 * errors are prettified and deduplicated.
 */
export function transformErrors(specification: AnyObject, errors: string | AjvError[]): ErrorObject[] {
  if (typeof errors === 'string') {
    return [{ message: errors }]
  }

  // If the specification is null or invalid, betterAjvErrors cannot process it.
  // This can happen when reference resolution fails.
  if (!specification || typeof specification !== 'object') {
    return [{ message: 'Invalid specification' }]
  }

  // Wrap betterAjvErrors in a try-catch since it can fail with malformed schemas.
  let processedErrors: ErrorObject[]

  try {
    processedErrors = betterAjvErrors(specification, errors).map((error) => ({
      ...error,
      message: error.message.trim(),
    }))
  } catch (error) {
    console.error(error)

    // If betterAjvErrors fails, fall back to the raw Ajv errors.
    if (Array.isArray(errors)) {
      return errors.map((err) => {
        let message = err.message || 'Validation error'

        // For additionalProperties errors, include the property name
        if (err.keyword === 'additionalProperties' && err.params?.additionalProperty) {
          message = `Property ${err.params.additionalProperty} is not expected to be here`
        }

        return {
          message,
          path: err.dataPath || err.instancePath,
        }
      })
    }

    return [{ message: 'Validation failed' }]
  }

  // Deduplicate errors with the same message and path
  const seen = new Set<string>()

  return processedErrors.filter((error) => {
    const key = `${error.message}||${error.path}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)

    return true
  })
}
