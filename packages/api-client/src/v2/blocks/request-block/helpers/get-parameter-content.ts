import type { MediaTypeObject, ParameterObject } from '@scalar/types/openapi/3.1'

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
