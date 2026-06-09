import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

/**
 * Pick the example body for a response media type.
 *
 * Precedence (per the OpenAPI Media Type Object plus the `Prefer: example=`
 * directive):
 * 1. A named example explicitly requested via `exampleName`.
 * 2. The singular `example` keyword.
 * 3. The first entry of the `examples` map.
 *
 * Returns a `{ value }` wrapper when an example is available — so a `null` or
 * otherwise falsy value is still treated as a real example — or `undefined`
 * to signal that the caller should fall back to generating a body from the
 * schema. An unknown `exampleName` simply falls through to the later steps.
 */
export const selectResponseExample = (
  mediaType: OpenAPIV3_1.MediaTypeObject | undefined,
  exampleName?: string,
): { value: unknown } | undefined => {
  if (!mediaType) {
    return undefined
  }

  const { example, examples } = mediaType

  // 1. A named example requested via `Prefer: example=<name>`
  if (exampleName && examples && exampleName in examples) {
    return { value: getResolvedRef(examples[exampleName])?.value }
  }

  // 2. The singular `example` keyword
  if (example !== undefined) {
    return { value: example }
  }

  // 3. The first entry of the `examples` map
  if (examples) {
    const firstKey = Object.keys(examples)[0]

    if (firstKey !== undefined) {
      return { value: getResolvedRef(examples[firstKey])?.value }
    }
  }

  // 4. Nothing defined: let the caller generate a body from the schema
  return undefined
}
