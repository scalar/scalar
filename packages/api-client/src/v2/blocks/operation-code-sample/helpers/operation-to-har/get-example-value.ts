import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { ParameterObject, RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Resolve an example value for a parameter or requestBody from either `examples` or `content.*.examples`.
 * Or the [deprecated] `example` field.
 */
export const getExampleValue = (
  param: ParameterObject | RequestBodyObject,
  example?: string,
  contentType?: string,
): unknown => {
  // Prefer explicit examples on the parameter
  if ('examples' in param && param.examples) {
    const exampleKey = example ?? Object.keys(param.examples)[0]
    const resolved = getResolvedRef(param.examples[exampleKey ?? ''])

    if (resolved?.value !== undefined) {
      return resolved.value
    }
  }

  // Fallback to examples inside content by content type
  if ('content' in param && param.content) {
    const mediaType = contentType ?? Object.keys(param.content)[0]
    const media = param.content[mediaType ?? '']

    if (media?.examples) {
      const exampleKey = example ?? Object.keys(media.examples)[0]
      const resolved = getResolvedRef(media.examples[exampleKey ?? ''])

      if (resolved?.value !== undefined) {
        return resolved.value
      }
    }

    // Handle the [deprecated] example
    if (media?.example !== undefined) {
      return media.example
    }
  }

  // Handle the [deprecated] example
  if ('example' in param && param.example !== undefined) {
    return param.example
  }

  return undefined
}
