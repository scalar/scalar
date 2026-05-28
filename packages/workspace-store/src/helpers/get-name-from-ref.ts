import { escapeJsonPointer } from '@scalar/helpers/json/escape-json-pointer'
import { parseJsonPointerSegments } from '@scalar/helpers/json/parse-json-pointer-segments'
import { safeRun } from '@scalar/helpers/types/safe-run'

/**
 * Extracts the trailing identifier from a `#/...` JSON Pointer `$ref` whose parent path matches
 * the expected sequence of segments. Decodes `~1`/`~0` escapes so identifiers containing `/` or `~`
 * round-trip to their map keys.
 *
 * Returns `undefined` when the ref does not start with `#/`, the parent path does not match
 * exactly, the trailing name is missing, or there are extra segments beyond the name.
 *
 * @example
 * getNameFromRef('#/channels/foo', ['channels']) // → 'foo'
 * getNameFromRef('#/components/securitySchemes/tenant~1admin~0v2', ['components', 'securitySchemes']) // → 'tenant/admin~v2'
 * getNameFromRef('#/servers/foo/extra', ['servers']) // → undefined
 */
export const getNameFromRef = (ref: string, parentPath: readonly string[]): string | undefined => {
  const prefix = `#/${parentPath.map(escapeJsonPointer).join('/')}/`
  if (!ref.startsWith(prefix)) {
    return undefined
  }

  const segmentsResult = safeRun(() => parseJsonPointerSegments(ref.slice(1)))
  if (!segmentsResult.ok) {
    return undefined
  }

  const segments = segmentsResult.data
  if (segments.length !== parentPath.length + 1) {
    return undefined
  }

  for (let i = 0; i < parentPath.length; i++) {
    if (segments[i] !== parentPath[i]) {
      return undefined
    }
  }

  const name = segments[parentPath.length]
  return name && name.length > 0 ? name : undefined
}
