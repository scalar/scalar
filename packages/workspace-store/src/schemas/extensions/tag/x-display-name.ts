import { Type } from '@scalar/typebox'

/**
 * An OpenAPI extension to overwrite tag names with a display-friendly version
 *
 * @example
 * ```yaml
 * x-displayName: planets
 * ```
 */
export const XDisplayNameSchema = Type.Object({
  'x-displayName': Type.Optional(Type.String()),
})
