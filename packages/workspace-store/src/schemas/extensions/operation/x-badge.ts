import { type Static, Type } from '@scalar/typebox'

/**
 * Schema for individual badge configuration in x-badges extension.
 * Badges are indicators that can be displayed in API documentation.
 */
export const BadgeSchema = Type.Object(
  {
    /** The text that displays in the badge. This is required for all badges. */
    name: Type.String({
      description: 'The text that displays in the badge',
      minLength: 1,
    }),
    /**
     * The position of the badge in relation to the header.
     * Defaults to 'after' if not specified.
     */
    position: Type.Optional(
      Type.Union([Type.Literal('before'), Type.Literal('after')], {
        description: 'The position of the badge in relation to the header',
        default: 'after',
      }),
    ),
    /**
     * The color of the badge. Can be defined in various formats such as color keywords,
     * RGB, RGBA, HSL, HSLA, and Hexadecimal.
     */
    color: Type.Optional(
      Type.String({
        description: 'The color of the badge in various formats (keywords, RGB, RGBA, HSL, HSLA, Hexadecimal)',
        pattern:
          '^(#([0-9A-Fa-f]{3}){1,2}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]*\\s*\\)|hsl\\(\\s*\\d+\\s*,\\s*\\d+%\\s*,\\s*\\d+%\\s*\\)|hsla\\(\\s*\\d+\\s*,\\s*\\d+%\\s*,\\s*\\d+%\\s*,\\s*[0-9.]*\\s*\\)|[a-zA-Z]+)$',
      }),
    ),
  },
  {
    description: 'Configuration for a single badge in the x-badges extension',
  },
)

export type XBadge = Static<typeof BadgeSchema>

/**
 * You can add badges to operations to use as indicators in documentation. Each operation can have multiple badges, and the displayed color is also configurable. The following example sets badges on the GET `/hello-world` operation:
 *
 * ```yaml
 * openapi: 3.1.0
 * info:
 *   title: x-badges
 *   version: 1.0.0
 * paths:
 *   /hello-world:
 *     get:
 *       summary: Hello World
 *       x-badges:
 *         - name: 'Alpha'
 *         - name: 'Beta'
 *           position: before
 *         - name: 'Gamma'
 *           position: after
 *           color: '#ffcc00'
```
 */
export const XBadgesSchema = Type.Object({
  'x-badges': Type.Optional(Type.Array(BadgeSchema)),
})
