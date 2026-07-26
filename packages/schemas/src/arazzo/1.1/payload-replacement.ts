import { object, optional, string, union, unknown } from '@scalar/validation'

import { arazzoExpressionTypeObject } from './expression-type'
import { arazzoSelectorObject } from './selector'

/** Payload Replacement Object. Describes a location within a payload and a value to set there. */
export const arazzoPayloadReplacementObject = object(
  {
    target: string({
      typeComment:
        'REQUIRED. A JSON Pointer, XPath Expression, or JSONPath which MUST be resolved against the request body.',
    }),
    targetSelectorType: optional(
      union([string(), arazzoExpressionTypeObject], {
        typeComment: 'The selector expression type to use, for example "jsonpath", "xpath", or "jsonpointer".',
      }),
    ),
    value: union([unknown(), string(), arazzoSelectorObject], {
      typeComment:
        'REQUIRED. The value set within the target location. Can be a constant, a Runtime Expression, or a Selector Object.',
    }),
  },
  { typeName: 'ArazzoPayloadReplacementObject' },
)
