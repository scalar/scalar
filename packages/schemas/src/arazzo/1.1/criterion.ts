import { object, optional, string, union } from '@scalar/validation'

import { arazzoExpressionTypeObject } from './expression-type'

/**
 * Criterion Object.
 *
 * Specifies the context, condition, and condition type used to prove or satisfy an assertion —
 * in `successCriteria`, or in a Success/Failure Action's `criteria`.
 */
export const arazzoCriterionObject = object(
  {
    context: optional(
      string({
        typeComment:
          'A Runtime Expression that defines the context of the condition. REQUIRED when type is regex, jsonpath, or xpath.',
      }),
    ),
    condition: string({
      typeComment: 'REQUIRED. The condition to evaluate, combining Runtime Expressions, literals, and operators.',
    }),
    type: optional(
      union([string(), arazzoExpressionTypeObject], {
        typeComment:
          'The type of condition: "simple" (default), "regex", "jsonpath", or "xpath". MAY be an Expression Type Object to pin a specific expression language version.',
      }),
    ),
  },
  { typeName: 'ArazzoCriterionObject' },
)
