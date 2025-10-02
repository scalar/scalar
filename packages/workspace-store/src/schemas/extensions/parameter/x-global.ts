import { Type } from '@scalar/typebox'

/**
 * OpenAPI extension used by the api-client application to determine if a parameter is considered global in scope
 * for the entire workspace. When set, this parameter will be injected into every request automatically.
 *
 * @example
 * ```yaml
 * x-global: true
 * ```
 */
export const XGlobal = Type.Object({
  'x-global': Type.Optional(Type.Boolean()),
})
