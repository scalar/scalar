import type { AnyObject } from '../types'
import { betterAjvErrors } from './betterAjvErrors'

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

  return betterAjvErrors(specification, null, errors, {
    indent: 2,
  }).map((error) => {
    error.message = error.message.trim()

    return error
  })
}
