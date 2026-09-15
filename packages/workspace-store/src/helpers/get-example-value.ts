import { parseMimeType } from '@scalar/helpers/http/mime-type'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { ExampleObject } from '@/schemas/v3.2/strict/example'
import type { ReferenceType } from '@/schemas/v3.2/strict/reference'

/** Preserve the source so consumers do not serialize wire text a second time. */
export type ExampleValue = { source: 'serialized'; value: string } | { source: 'data' | 'value'; value: unknown }

/** Select an explicit example without confusing false, zero, null, or empty text with absence. */
export const getExampleValue = (input: ReferenceType<ExampleObject> | undefined): ExampleValue | undefined => {
  const example = getResolvedRef(input)
  if (example?.serializedValue !== undefined) {
    return { source: 'serialized', value: example.serializedValue }
  }
  if (example?.dataValue !== undefined) {
    return { source: 'data', value: example.dataValue }
  }
  if (example?.value !== undefined) {
    return { source: 'value', value: example.value }
  }
  // externalValue is fetched by the bundler; until then it is not an inline payload.
  return undefined
}

/** Serialize only structured JSON data; format-specific consumers handle other media types. */
export const getJsonExampleText = (
  example: ExampleValue | undefined,
  contentType: string,
  indent?: number,
): string | undefined => {
  if (example?.source === 'serialized') {
    return example.value
  }
  const { essence, subtype } = parseMimeType(contentType)
  if (example?.source === 'data' && (essence === 'application/json' || subtype.endsWith('+json'))) {
    return JSON.stringify(example.value, null, indent)
  }
  return undefined
}
