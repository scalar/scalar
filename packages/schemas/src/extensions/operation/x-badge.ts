import { array, literal, object, optional, string, union } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

/**
 * Schema for individual badge configuration in the x-badges extension.
 * Badges are indicators that can be displayed in API documentation.
 */
export const XBadge = object(
  {
    name: string({
      typeComment: 'The text that displays in the badge. This is required for all badges.',
    }),
    position: optional(
      union([literal('before'), literal('after')], {
        typeComment: 'The position of the badge in relation to the header. Defaults to `after` when omitted.',
      }),
    ),
    color: optional(
      string({
        typeComment: 'The color of the badge in various formats (keywords, RGB, RGBA, HSL, HSLA, Hexadecimal)',
      }),
    ),
  },
  {
    typeName: 'XBadge',
    typeComment: typeCommentWithExample('Configuration for a single badge in the x-badges extension.', {
      language: 'yaml',
      body: `name: Beta
position: before
color: "#ffcc00"`,
    }),
  },
)

/**
 * Badges for an operation in the Scalar UI.
 *
 * You can add badges to operations to use as indicators in documentation. Each operation can have multiple badges,
 * and the displayed color is also configurable.
 *
 * @example
 * ```yaml
 * paths:
 *   /hello-world:
 *     get:
 *       summary: Hello World
 *       x-badges:
 *         - name: Alpha
 *         - name: Beta
 *           position: before
 *         - name: Gamma
 *           position: after
 *           color: "#ffcc00"
 * ```
 */
export const XBadges = object(
  {
    'x-badges': optional(
      array(XBadge, {
        typeComment: 'Badges displayed for this operation in documentation',
      }),
    ),
  },
  {
    typeName: 'XBadges',
    typeComment: typeCommentWithExample(
      'Badges for an operation in the Scalar UI. Use as visual indicators in documentation.',
      {
        language: 'yaml',
        body: `x-badges:
  - name: Alpha
  - name: Beta
    position: before`,
      },
    ),
  },
)
