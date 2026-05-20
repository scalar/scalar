import { boolean, object, optional } from '@scalar/validation'

import { typeCommentInlineCode, typeCommentWithExample } from '../type-comment'

/**
 * OpenAPI extension to control whether a parameter example is enabled (checkbox on) or disabled (checkbox off).
 *
 * This extension is typically used in API tools to determine if a parameter (such as a header, query, or cookie)
 * should be included in the request when sending an example. If `x-disabled: true`, the parameter example is considered
 * "off" (checkbox unchecked) and will not be sent with the request. If `x-disabled: false` or omitted, the parameter
 * example is "on" (checkbox checked) and will be sent.
 *
 * @example
 * ```yaml
 * x-disabled: true
 * ```
 */
export const XDisabled = object(
  {
    'x-disabled': optional(
      boolean({
        typeComment: 'When true, the parameter example is not sent with the request',
      }),
    ),
  },
  {
    typeName: 'XDisabled',
    typeComment: typeCommentWithExample(
      `Whether a parameter example is disabled in the API client (${typeCommentInlineCode('true')} = not sent).`,
      { language: 'yaml', body: 'x-disabled: true' },
    ),
  },
)
