import { object, string, union } from '@scalar/validation'

import { arazzoExpressionTypeObject } from './expression-type'

/**
 * Selector Object.
 *
 * Describes a location within a context (for example a response body) to extract a value from,
 * using an expression type such as `jsonpath` or `xpath`.
 */
export const arazzoSelectorObject = object(
  {
    context: string({
      typeComment: 'REQUIRED. A Runtime Expression that defines the context to apply the selector to.',
    }),
    selector: string({ typeComment: 'REQUIRED. The selector expression to apply to the context.' }),
    type: union([string(), arazzoExpressionTypeObject], {
      typeComment:
        'REQUIRED. The type of selector expression, for example "jsonpath", "xpath", or "jsonpointer". MAY be an Expression Type Object to pin a specific expression language version.',
    }),
  },
  { typeName: 'ArazzoSelectorObject' },
)
