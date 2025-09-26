import { Type } from '@scalar/typebox'

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
