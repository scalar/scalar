import { Type } from '@scalar/typebox'

/**
 * An OpenAPI extension to associate a parameter with a specific route
 *
 * @example
 * ```yaml
 * x-route: /cookies
 * ```
 */
export const XRoute = Type.Object({
  'x-route': Type.Optional(Type.String()),
})
