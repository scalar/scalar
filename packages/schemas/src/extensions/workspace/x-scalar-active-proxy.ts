import { nullable, object, optional, string, union } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

/**
 * Schema for the x-scalar-active-proxy extension.
 *
 * This property indicates the currently selected proxy identifier.
 *
 * @example
 * ```json
 * { "x-scalar-active-proxy": "my-proxy-id" }
 * ```
 */
export const XScalarActiveProxy = object(
  {
    'x-scalar-active-proxy': optional(
      union([string(), nullable()], {
        typeComment: 'The currently selected proxy identifier, or null when none is selected',
      }),
    ),
  },
  {
    typeName: 'XScalarActiveProxy',
    typeComment: typeCommentWithExample('The currently selected proxy identifier for the workspace.', {
      language: 'json',
      body: '{ "x-scalar-active-proxy": "my-proxy-id" }',
    }),
  },
)
