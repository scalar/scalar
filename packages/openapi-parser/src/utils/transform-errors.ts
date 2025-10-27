import type { AnyObject } from '@/types/index'

import { betterAjvErrors } from './betterAjvErrors/index'

/**
 * Transforms ajv errors, finds the positions in the schema and returns an enriched format.
 */
export function transformErrors(specification: AnyObject, errors: any) {
  // TODO: This should work with multiple files

  if (typeof errors === 'string') {
    return [
      {
        message: errors,
      },
    ]
  }

  // If specification is null or invalid, betterAjvErrors cannot process it
  // This can happen when reference resolution fails
  if (!specification || typeof specification !== 'object') {
    return [
      {
        message: 'Invalid specification',
      },
    ]
  }

  // Wrap betterAjvErrors in a try-catch since it can fail with malformed schemas
  let processedErrors
  try {
    processedErrors = betterAjvErrors(specification, null, errors, {
      indent: 2,
    }).map((error) => {
      error.message = error.message.trim()

      return error
    })
  } catch (error) {
    console.error(error)
    // If betterAjvErrors fails, fall back to raw AJV errors
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
    return [
      {
        message: 'Validation failed',
      },
    ]
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
