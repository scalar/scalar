import { Type } from '@scalar/typebox'
import { object, optional, string } from '@scalar/validation'

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

/**
 * An OpenAPI extension to overwrite tag names with a display-friendly version
 *
 * @example
 * ```yaml
 * x-displayName: planets
 * ```
 */
export type XDisplayName = {
  'x-displayName'?: string
}

export const XDisplayName = object(
  {
    'x-displayName': optional(string()),
  },
  {
    typeName: 'XDisplayName',
    typeComment: 'Display-friendly name for a tag',
  },
)
