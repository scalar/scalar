import { Type } from '@scalar/typebox'
import { boolean, object, optional } from '@scalar/validation'

/**
 * OpenAPI extension used by the api-client application to determine if a parameter is considered global in scope
 * for the entire workspace. When set, this parameter will be injected into every request automatically.
 *
 * @example
 * ```yaml
 * x-global: true
 * ```
 */
export const XGlobalSchema = Type.Object({
  'x-global': Type.Optional(Type.Boolean()),
})

export type XGlobal = {
  'x-global'?: boolean
}

export const XGlobal = object(
  {
    'x-global': optional(boolean()),
  },
  {
    typeName: 'XGlobal',
    typeComment: 'When true, the parameter is injected into every request for the workspace',
  },
)
