import { type RenderedExample, getRenderedExample, normalizeRenderedExamples } from '@scalar/blocks/schema/helpers'
import { isObject } from '@scalar/helpers/object/is-object'
import type {
  HeaderObject,
  MediaTypeObject,
  ParameterObject,
  ResponseObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

type GetParameterExamplesArgs = {
  parameter: ParameterObject | HeaderObject | ResponseObject
  content?: MediaTypeObject
}

/** Select explicit examples without mixing them with examples from a less specific source. */
const getExamples = (
  source: ParameterObject | HeaderObject | ResponseObject | MediaTypeObject | undefined,
  preferData: boolean,
): RenderedExample[] => {
  if (source && 'example' in source && source.example !== undefined) {
    return normalizeRenderedExamples([source.example])
  }
  if (!source || !('examples' in source) || !isObject(source.examples)) {
    return []
  }
  return Object.entries(source.examples).flatMap(([name, entry]) => {
    const example = getRenderedExample(entry, name, preferData)
    return example ? [example] : []
  })
}

/** Prefer parameter/header examples to media type examples; the caller retains schema examples as a fallback. */
export const getParameterExamples = ({ parameter, content }: GetParameterExamplesArgs): RenderedExample[] => {
  const preferData = 'in' in parameter && parameter.in === 'querystring'
  const parameterExamples = getExamples(parameter, preferData)
  return parameterExamples.length ? parameterExamples : getExamples(content, preferData)
}
