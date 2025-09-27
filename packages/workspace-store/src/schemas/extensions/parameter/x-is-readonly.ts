import { Type } from '@scalar/typebox'

/**
 * An OpenAPI extension to mark parameters as read-only
 *
 * @example
 * ```yaml
 * x-is-readonly: true
 * ```
 */
export const XIsReadonly = Type.Object({
  'x-is-readonly': Type.Optional(Type.Boolean()),
})
