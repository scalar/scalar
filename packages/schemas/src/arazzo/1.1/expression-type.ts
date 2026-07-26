import { object, string } from '@scalar/validation'

/**
 * Expression Type Object.
 *
 * Explicitly names the expression language (and its version) used for a `jsonpath` or `xpath`
 * Criterion condition or Payload Replacement target, when the default version is not sufficient.
 */
export const arazzoExpressionTypeObject = object(
  {
    type: string({ typeComment: 'REQUIRED. The type of expression, for example "jsonpath" or "xpath".' }),
    version: string({ typeComment: 'REQUIRED. The version of the expression type being used.' }),
  },
  { typeName: 'ArazzoExpressionTypeObject' },
)
