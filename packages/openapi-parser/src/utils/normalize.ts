import { parse } from 'yaml'

import type { AnyObject, Filesystem } from '../types'
import { isFilesystem } from './isFilesystem'

/**
 * Normalize the OpenAPI document (YAML, JSON, object) to a JavaScript object.
 *
 * Doesn’t modify the object if it’s a `Filesystem` (multiple files) already.
 */
export function normalize(
  specification: string | AnyObject | Filesystem,
): AnyObject | Filesystem {
  if (isFilesystem(specification)) {
    return specification as Filesystem
  }

  if (typeof specification === 'string') {
    try {
      return JSON.parse(specification)
    } catch (error) {
      return parse(specification, {
        maxAliasCount: 10000,
      })
    }
  }

  return specification
}

/**
 * Normalize the OpenAPI document (YAML, JSON, object) to a JavaScript object.
 *
 * Catch any parsing errors and return messages
 */
export function normalizeSafe(specification: string | AnyObject | Filesystem): {
  error: boolean
  content: AnyObject | Filesystem | null
} {
  if (isFilesystem(specification)) {
    return {
      content: specification as Filesystem,
      error: false,
    }
  }

  if (typeof specification === 'string') {
    try {
      return {
        error: false,
        content: JSON.parse(specification),
      }
    } catch (error) {
      try {
        return {
          error: false,
          content: parse(specification, {
            maxAliasCount: 10000,
          }),
        }
      } catch {
        return {
          error: true,
          content: null,
        }
      }
    }
  }

  return {
    error: false,
    content: specification,
  }
}
