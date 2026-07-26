import { array, object, optional, string, unknown } from '@scalar/validation'

import { arazzoPayloadReplacementObject } from './payload-replacement'

/** Request Body Object. Describes the Content-Type and request body content passed by a step. */
export const arazzoRequestBodyObject = object(
  {
    contentType: optional(
      string({
        typeComment:
          'The Content-Type for the request content. If omitted, refer to the Content-Type on the targeted operation.',
      }),
    ),
    payload: optional(
      unknown({
        typeComment:
          'A value representing the request body payload. May be a literal value or contain Runtime Expressions or Selector Objects.',
      }),
    ),
    replacements: optional(
      array(arazzoPayloadReplacementObject, { typeComment: 'A list of locations and values to set within a payload.' }),
    ),
  },
  { typeName: 'ArazzoRequestBodyObject' },
)
