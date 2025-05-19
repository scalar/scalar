import type { UnknownObject } from '@scalar/types/utils'
import { parse } from 'yaml'

import type { Filesystem } from '@/types/index'
import { isFilesystem } from './is-filesystem'

/**
 * Normalize the OpenAPI document (YAML, JSON, object) to a JavaScript object.
 *
 * Doesn’t modify the object if it’s a `Filesystem` (multiple files) already.
 */
export function normalize(content: string | UnknownObject | Filesystem): UnknownObject | Filesystem {
  if (content === null) {
    return {}
  }

  if (typeof content === 'string') {
    if (content.trim() === '') {
      return {}
    }

    try {
      return JSON.parse(content)
    } catch (_error) {
      // Does it look like YAML?
      if (!/^[^:]+:/.test(content)) {
        return {}
      }

      return parse(content, {
        maxAliasCount: 10000,
      })
    }
  }

  if (isFilesystem(content)) {
    return content
  }

  return content
}
