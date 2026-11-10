import { isObjectLike } from '@scalar/helpers/object/is-object'
import type { ParameterObject, ResponseObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { getRenderedExample } from './get-rendered-example'

const filterUndefined = (example: unknown): example is unknown => example !== undefined

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
}: GetParameterExamplesArgs): unknown[] => {
  const paramExamples = 'examples' in parameter && isObjectLike(parameter.examples) ? parameter.examples : {}

  if ('in' in parameter && parameter.in === 'querystring') {
    const examples = Object.values({
      ...(isObjectLike(contentExamples) ? contentExamples : {}),
      ...paramExamples,
    }).flatMap((entry) => {
      const example = getRenderedExample(entry, true)
      return example ? [example] : []
    })
    if (examples.length) {
      return examples
    }
    return (parameter.example !== undefined ? [parameter.example] : (schemaExamples ?? []))
      .filter(filterUndefined)
      .map((value) => ({ value }))
  }

  const recordExamples = Object.values({
    ...paramExamples,
    ...(isObjectLike(contentExamples) ? contentExamples : {}),
  }).flatMap((entry) => {
    const example = getRenderedExample(entry)
    return example ? [example] : []
  })

  const fallbackExample =
    recordExamples.length === 0 && 'example' in parameter && parameter.example !== undefined ? [parameter.example] : []

  const arrayExamples = (schemaExamples ?? fallbackExample).filter(filterUndefined)

  return [...recordExamples, ...arrayExamples]
}
