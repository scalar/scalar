import { Type } from '@scalar/typebox'

/**
 * An OpenAPI extension to mark parameters as global
 *
 * @example
 * ```yaml
 * x-is-global: true
 * ```
 */
export const XIsGlobal = Type.Object({
  'x-is-global': Type.Optional(Type.Boolean()),
})
