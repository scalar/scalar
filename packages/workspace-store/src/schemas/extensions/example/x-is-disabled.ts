import { Type } from '@scalar/typebox'

/**
 * An OpenAPI extension to mark examples as enabled or disabled
 *
 * @example
 * ```yaml
 * x-is-disabled: false
 * ```
 */
export const XIsDisabled = Type.Object({
  'x-is-disabled': Type.Optional(Type.Boolean()),
})
