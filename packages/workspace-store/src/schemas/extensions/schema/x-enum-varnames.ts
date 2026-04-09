import { Type } from '@scalar/typebox'
import { array, object, optional, string } from '@scalar/validation'

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

export type XEnumVarNames = {
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
  'x-enum-varnames'?: string[]
  /**
   * x-enumNames
   *
   * Names the enum values, must be in the same order as the enum values.
   *
   * @example
   * ```yaml
   * enum:
   *   - moon
   *   - asteroid
   *   - comet
   * x-enumNames:
   *   - Moon
   *   - Asteroid
   *   - Comet
   * ```
   */
  'x-enumNames'?: string[]
}

export const XEnumVarNames = object(
  {
    'x-enum-varnames': optional(array(string())),
    'x-enumNames': optional(array(string())),
  },
  {
    typeName: 'XEnumVarNames',
    typeComment: 'Display names for enum values',
  },
)
