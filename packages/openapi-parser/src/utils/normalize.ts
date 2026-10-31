import type { UnknownObject } from '@scalar/types/utils'
import { parse } from 'yaml'

import type { Filesystem } from '@/types/index'

import { isFilesystem } from './is-filesystem'

/**
 * Strip a leading UTF-8 BOM (U+FEFF). Editors on Windows often write this
 * prefix; {@link JSON.parse} rejects it as an unexpected token.
 */
const stripLeadingUtf8Bom = (value: string): string => (value.startsWith('\uFEFF') ? value.slice(1) : value)

/**
 * Normalize the OpenAPI document (YAML, JSON, object) to a JavaScript object.
 *
 * Doesn't modify the object if it's a `Filesystem` (multiple files) already.
 */
export function normalize(content: string | UnknownObject | Filesystem): UnknownObject | Filesystem {
  if (content === null) {
    return undefined
  }

  if (typeof content === 'string') {
    const withoutBom = stripLeadingUtf8Bom(content)

    if (withoutBom.trim() === '') {
      return undefined
    }

    try {
      return JSON.parse(withoutBom)
    } catch {
      // Does it look like YAML?
      const hasColon = /^[^:]+:/.test(withoutBom)
      const isJson = withoutBom.slice(0, 50).trimStart().startsWith('{')

      if (!hasColon || isJson) {
        return undefined
      }

      return parse(withoutBom, {
        maxAliasCount: 10000,
        merge: true,
      })
    }
  }

  if (isFilesystem(content)) {
    return content
  }

  return content
}
