import { array, literal, object, optional, string, union } from '@scalar/validation'

export const XBadge = object(
  {
    name: string({
      typeComment: 'The text that displays in the badge. This is required for all badges.',
    }),
    position: optional(
      union([literal('before'), literal('after')], {
        typeComment: 'The position of the badge in relation to the header',
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
    typeComment: 'Configuration for a single badge in the x-badges extension',
  },
)

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
    typeComment: 'Badges for an operation in the Scalar UI',
  },
)
