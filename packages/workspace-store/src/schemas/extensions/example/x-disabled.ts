import { Type } from '@scalar/typebox'
import { boolean, object, optional } from '@scalar/validation'

/**
 * OpenAPI extension to control whether a parameter example is enabled (checkbox on) or disabled (checkbox off).
 *
 * This extension is typically used in API tools to determine if a parameter (such as a header, query, or cookie)
 * should be included in the request when sending an example. If `x-disabled: true`, the parameter example is considered
 * "off" (checkbox unchecked) and will not be sent with the request. If `x-disabled: false` or omitted, the parameter
 * example is "on" (checkbox checked) and will be sent.
 *
 * @example
 * ```yaml
 * x-disabled: true   # Do not send this parameter example in the request
 * x-disabled: false  # Send this parameter example in the request
 * ```
 */
export const XDisabledSchema = Type.Object({
  'x-disabled': Type.Optional(Type.Boolean()),
})

export type XDisabled = {
  'x-disabled'?: boolean
}

export const XDisabled = object(
  {
    'x-disabled': optional(boolean()),
  },
  {
    typeName: 'XDisabled',
    typeComment: 'Whether a parameter example is disabled in the API client',
  },
)
