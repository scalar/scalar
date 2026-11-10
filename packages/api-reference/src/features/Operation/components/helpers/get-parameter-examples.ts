import { type RenderedExample, getRenderedExample, normalizeRenderedExamples } from '@scalar/blocks/schema/helpers'
import { isObjectLike } from '@scalar/helpers/object/is-object'
import type { ParameterObject, ResponseObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

type GetParameterExamplesArgs = {
  parameter: ParameterObject | ResponseObject
  schemaExamples?: unknown[]
  contentExamples?: unknown
}

/**
 * Build a normalized examples array from parameter/content/schema examples.
 * Undefined values are removed so the UI does not render "undefined" entries.
 */
export const getParameterExamples = ({
  parameter,
  schemaExamples,
  contentExamples,
}: GetParameterExamplesArgs): RenderedExample[] => {
  const paramExamples = 'examples' in parameter && isObjectLike(parameter.examples) ? parameter.examples : {}

  if ('in' in parameter && parameter.in === 'querystring') {
    const examples = Object.entries({
      ...(isObjectLike(contentExamples) ? contentExamples : {}),
      ...paramExamples,
    }).flatMap(([name, entry]) => {
      const example = getRenderedExample(entry, name, true)
      return example ? [example] : []
    })
    if (examples.length) {
      return examples
    }
    return normalizeRenderedExamples(parameter.example !== undefined ? [parameter.example] : (schemaExamples ?? []))
  }

  const recordExamples = normalizeRenderedExamples({
    ...paramExamples,
    ...(isObjectLike(contentExamples) ? contentExamples : {}),
  })

  const fallbackExample =
    recordExamples.length === 0 && 'example' in parameter && parameter.example !== undefined ? [parameter.example] : []

  const arrayExamples = normalizeRenderedExamples(schemaExamples ?? fallbackExample)

  return [...recordExamples, ...arrayExamples]
}
