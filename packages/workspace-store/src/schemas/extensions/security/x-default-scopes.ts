import { Type } from '@scalar/typebox'
import { array, object, optional, string } from '@scalar/validation'

/**
 * Default selected scopes for the oauth flow
 *
 * @example
 * ```json
 * {
 *   "x-default-scopes": [
 *     "profile",
 *     "email"
 *   ]
 * }
 * ```
 */
export const XDefaultScopesSchema = Type.Object({
  'x-default-scopes': Type.Optional(Type.Array(Type.String())),
})

export type XDefaultScopes = {
  /**
   * Default selected scopes for the oauth flow
   *
   * @example
   * ```json
   * {
   *   "x-default-scopes": [
   *     "profile",
   *     "email"
   *   ]
   * }
   * ```
   */
  'x-default-scopes'?: string[]
}

export const XDefaultScopes = object(
  {
    'x-default-scopes': optional(array(string())),
  },
  {
    typeName: 'XDefaultScopes',
    typeComment: 'Default selected OAuth scopes',
  },
)
