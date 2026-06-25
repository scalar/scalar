import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'

import { getResolvedRef } from '@/helpers/get-resolved-ref'

/**
 * Resolves a JSON pointer against a value, following any `$ref` encountered
 * along the way so intermediate references do not break the lookup.
 *
 * @example
 * ```ts
 * getValueByPointer(document, '#/components/schemas/User')
 * ```
 *
 * @returns The value at the pointer (with a leading `$ref` resolved), or
 * `undefined` when the pointer does not resolve.
 */
export const getValueByPointer = (value: unknown, pointer: string): unknown => {
  let current: unknown = value

  for (const segment of parseJsonPointerSegments(pointer)) {
    current = getResolvedRef(current)

    if (typeof current !== 'object' || current === null) {
      return undefined
    }

    current = (current as Record<string, unknown>)[segment]
  }

  return getResolvedRef(current)
}
