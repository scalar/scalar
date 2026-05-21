import { array, object, optional, string } from '@scalar/validation'

import { typeCommentInlineCode, typeCommentWithExample } from '../type-comment'

/**
 * x-enum-varnames / x-enumNames
 *
 * Names the enum values. Must be in the same order as the enum values.
 *
 * @example
 * ```yaml
 * enum:
 *   - moon
 *   - asteroid
 *   - comet
 * x-enum-varnames:
 *   - Moon
 *   - Asteroid
 *   - Comet
 * ```
 */
export const XEnumVarNames = object(
  {
    'x-enum-varnames': optional(
      array(string(), {
        typeComment: 'Display names for enum values (same order as `enum`)',
      }),
    ),
    'x-enumNames': optional(
      array(string(), {
        typeComment: 'Alias for x-enum-varnames — display names for enum values',
      }),
    ),
  },
  {
    typeName: 'XEnumVarNames',
    typeComment: typeCommentWithExample(
      `Display names for enum values. Must match the order of the ${typeCommentInlineCode('enum')} array.`,
      {
        language: 'yaml',
        body: `enum: [moon, asteroid]
x-enum-varnames: [Moon, Asteroid]`,
      },
    ),
  },
)
