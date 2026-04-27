import type { ParameterObject, ResponseObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { isObjectLike } from '@scalar/helpers/object/is-object'

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

  const recordExamples = Object.values({
    ...paramExamples,
    ...(isObjectLike(contentExamples) ? contentExamples : {}),
  }).filter(filterUndefined)

  const fallbackExample =
    recordExamples.length === 0 && 'example' in parameter && parameter.example !== undefined ? [parameter.example] : []

  const arrayExamples = (schemaExamples ?? fallbackExample).filter(filterUndefined)

  return [...recordExamples, ...arrayExamples]
}
