import { Type } from '@scalar/typebox'

/**
 * x-enum-varnames
 *
 * Names the enum values, must be in the same order as the enum values.
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
export const XEnumVarNamesSchema = Type.Object({
  'x-enum-varnames': Type.Optional(Type.Array(Type.String())),
  'x-enumNames': Type.Optional(Type.Array(Type.String())),
})
