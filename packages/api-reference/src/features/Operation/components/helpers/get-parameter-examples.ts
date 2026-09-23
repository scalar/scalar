import { isObjectLike } from '@scalar/helpers/object/is-object'
import { getExampleValue } from '@scalar/workspace-store/helpers/get-example-value'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ParameterObject, ResponseObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

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
    })
      .map((entry) => {
        const example = getResolvedRef(entry)
        if (!isObjectLike(example)) {
          return example
        }
        return example.dataValue !== undefined ? example.dataValue : (example.serializedValue ?? example.value)
      })
      .filter(filterUndefined)
    if (examples.length) {
      // The rendering component unwraps Example Objects once, so preserve a wrapper around object data.
      return examples.map((value) => ({ value }))
    }
    return (parameter.example !== undefined ? [parameter.example] : (schemaExamples ?? []))
      .filter(filterUndefined)
      .map((value) => ({ value }))
  }

  const recordExamples = Object.values({
    ...paramExamples,
    ...(isObjectLike(contentExamples) ? contentExamples : {}),
  })
    .map((entry) => {
      const resolved = getResolvedRef(entry)
      if (isObjectLike(resolved) && ('dataValue' in resolved || 'serializedValue' in resolved)) {
        return { value: getExampleValue(resolved)?.value }
      }
      return entry
    })
    .filter(filterUndefined)

  const fallbackExample =
    recordExamples.length === 0 && 'example' in parameter && parameter.example !== undefined ? [parameter.example] : []

  const arrayExamples = (schemaExamples ?? fallbackExample).filter(filterUndefined)

  return [...recordExamples, ...arrayExamples]
}
