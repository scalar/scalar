import type { MediaTypeObject, ParameterObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

/**
 * Extract content value from parameter object
 *
 * Parameters MUST only have one specified content key
 */
export const getParameterContentValue = (parameter: ParameterObject): MediaTypeObject | undefined => {
  if ('content' in parameter && parameter.content) {
    const keys = Object.keys(parameter.content)

    if (keys.length !== 1) {
      return undefined
    }

    return parameter.content[keys[0]!]
  }

  return undefined
}
