import { Type } from '@scalar/typebox'

export const xScalarCookieSchema = Type.Object({
  name: Type.String(),
  value: Type.String(),
  domain: Type.Optional(Type.String()),
  isDisabled: Type.Optional(Type.Boolean()),
})

export type XScalarCookie = {
  /**
   * Defines the cookie name and its value. A cookie definition begins with a name-value pair.
   */
  name: string
  /**
   * Defines the cookie value.
   */
  value: string
  /**
   * Defines the host to which the cookie will be sent.
   */
  domain?: string
  /**
   * Indicates if the cookie is disabled.
   */
  isDisabled?: boolean
}

export const xScalarCookiesSchema = Type.Object({
  'x-scalar-cookies': Type.Optional(Type.Array(xScalarCookieSchema)),
})
export type XScalarCookies = {
  'x-scalar-cookies'?: XScalarCookie[]
}
