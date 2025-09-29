import type { ParameterObject, RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { getResolvedRefDeep } from '@/v2/blocks/operation-code-sample/helpers/get-resolved-ref-deep'

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
  if (example && 'examples' in param && param.examples) {
    const resolved = getResolvedRefDeep(param.examples[example])?.value

    if (resolved) {
      return resolved
    }
  }

  // Fallback to examples inside content by content type
  if ('content' in param && param.content) {
    const mediaType = contentType ?? Object.keys(param.content)[0]
    const media = param.content[mediaType ?? '']

    if (media?.examples) {
      const exampleKey = example ?? Object.keys(media.examples)[0]
      const resolved = getResolvedRefDeep(media.examples[exampleKey ?? ''])

      if (resolved) {
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

  // Finally fallback to the first example
  if ('examples' in param && param.examples) {
    const exampleKey = Object.keys(param.examples)[0] ?? ''
    const resolved = getResolvedRefDeep(param.examples[exampleKey])?.value

    if (resolved) {
      return resolved
    }
  }

  return undefined
}
