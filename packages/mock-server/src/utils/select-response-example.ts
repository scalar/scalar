import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ExampleObject } from '@scalar/workspace-store/schemas/v3.2/strict/example'

/** Keep serialized/data examples distinguishable until the media serializer runs. */
const exampleValue = (example: ExampleObject | undefined): (ExampleObject & { value: unknown }) | undefined => {
  if (example?.serializedValue !== undefined) {
    return { serializedValue: example.serializedValue, value: example.serializedValue }
  }
  if (example?.dataValue !== undefined) {
    return { dataValue: example.dataValue, value: example.dataValue }
  }
  return example?.value !== undefined ? { value: example.value } : undefined
}

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
 * schema. An example whose resolved `value` is `undefined` (for example, an
 * Example Object that only carries an `externalValue`) is skipped, so the
 * caller still gets a schema-generated body. An unknown `exampleName` simply
 * falls through to the later steps.
 */
export const selectResponseExample = (
  mediaType: OpenAPIV3_1.MediaTypeObject | undefined,
  exampleName?: string,
): (ExampleObject & { value: unknown }) | undefined => {
  if (!mediaType) {
    return undefined
  }

  const { example, examples } = mediaType

  // 1. A named example requested via `Prefer: example=<name>`
  if (exampleName && examples && exampleName in examples) {
    const selected = exampleValue(getResolvedRef(examples[exampleName]))
    if (selected) {
      return selected
    }
  }

  // 2. The singular `example` keyword
  if (example !== undefined) {
    return { value: example }
  }

  // 3. The first entry of the `examples` map
  if (examples) {
    const firstKey = Object.keys(examples)[0]

    if (firstKey !== undefined) {
      const selected = exampleValue(getResolvedRef(examples[firstKey]))
      if (selected) {
        return selected
      }
    }
  }

  // 4. Nothing defined: let the caller generate a body from the schema
  return undefined
}
