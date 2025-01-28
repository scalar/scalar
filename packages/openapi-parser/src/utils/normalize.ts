import type { UnknownObject } from '@scalar/types/utils'
import { parse } from 'yaml'

import type { Filesystem } from '../types/index.ts'
import { isFilesystem } from './isFilesystem.ts'

/**
 * Normalize the OpenAPI document (YAML, JSON, object) to a JavaScript object.
 *
 * Doesn’t modify the object if it’s a `Filesystem` (multiple files) already.
 */
export function normalize(
  specification: string | UnknownObject | Filesystem,
): UnknownObject | Filesystem {
  if (specification === null) {
    return {}
  }

  if (typeof specification === 'string') {
    if (specification.trim() === '') {
      return {}
    }

    try {
      return JSON.parse(specification)
    } catch (error) {
      return parse(specification, {
        maxAliasCount: 10000,
      })
    }
  }

  if (isFilesystem(specification)) {
    return specification as Filesystem
  }

  return specification
}
