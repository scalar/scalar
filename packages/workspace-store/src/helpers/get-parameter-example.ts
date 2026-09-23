import { getFirstMediaType } from '@scalar/helpers/http/get-first-media-type'

import { getExampleValue, getExplicitExampleText } from '@/helpers/get-example-value'
import { getExample } from '@/request-example/builder/helpers/get-example'
import type { ExampleObject, ParameterObject } from '@/schemas/v3.2/strict/openapi-document'

/** A parameter example with its wire representation kept distinct from data. */
type ParameterExample = {
  example: ExampleObject | undefined
  value: unknown
  /** Parameter-level serialized text already includes URI encoding and query/cookie names. */
  serialized: boolean
  /** Media-level text still needs the parameter name and URI encoding. */
  mediaSerialized: boolean
}

/** Resolve new and legacy example fields without serializing parameter-level wire text again. */
export const getParameterExample = (parameter: ParameterObject, exampleName?: string): ParameterExample => {
  const authored = getExample({ ...parameter, content: undefined, schema: undefined }, exampleName, undefined)
  const example = authored ?? getExample(parameter, exampleName, undefined)
  const selected = getExampleValue(example)
  const contentType = 'content' in parameter ? getFirstMediaType(parameter.content)?.[0] : undefined
  const mediaText = contentType ? getExplicitExampleText(selected, contentType) : undefined
  return {
    example,
    value:
      contentType && selected && !(authored && selected.source === 'serialized')
        ? (mediaText ?? selected.value)
        : selected?.value,
    mediaSerialized:
      contentType !== undefined && mediaText !== undefined && !(authored && selected?.source === 'serialized'),
    serialized: authored !== undefined && selected?.source === 'serialized',
  }
}
