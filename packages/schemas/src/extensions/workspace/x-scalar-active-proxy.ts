import { nullable, object, optional, string, union } from '@scalar/validation'

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
    typeComment:
      'The currently selected proxy identifier for the workspace.\n\n@example\n```json\n{ "x-scalar-active-proxy": "my-proxy-id" }\n```',
  },
)
