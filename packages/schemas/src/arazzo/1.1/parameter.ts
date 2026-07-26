import { literal, object, optional, string, union, unknown } from '@scalar/validation'

import { arazzoSelectorObject } from './selector'

/**
 * Parameter Object.
 *
 * Describes a single step parameter. A unique parameter is defined by the combination of `name`
 * and `in`.
 */
export const arazzoParameterObject = object(
  {
    name: string({ typeComment: 'REQUIRED. The name of the parameter.' }),
    in: optional(
      union([literal('path'), literal('query'), literal('querystring'), literal('header'), literal('cookie')], {
        typeComment:
          'The location of the parameter. REQUIRED unless the parameter is defined with a Reusable Object referencing a Components parameter.',
      }),
    ),
    value: union([unknown(), string(), arazzoSelectorObject], {
      typeComment:
        'REQUIRED. The value to pass in the parameter. Can be a constant, a Runtime Expression, or a Selector Object.',
    }),
  },
  { typeName: 'ArazzoParameterObject' },
)
