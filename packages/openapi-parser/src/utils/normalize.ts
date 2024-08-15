import { parse } from 'yaml'

import type { AnyObject, Filesystem } from '../types'
import { isFilesystem } from './isFilesystem'

/**
 * Normalize the OpenAPI specification to a JavaScript object.
 * Don’t touch the object if it’s a `Filesystem` (multiple files).
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
