import { Type } from '@scalar/typebox'

export const xScalarCookieSchema = Type.Object({
  name: Type.String(),
  value: Type.String(),
  domain: Type.Optional(Type.String()),
  path: Type.Optional(Type.String()),
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
   * Allows this domain and all subdomains, is less restrictive than not setting a domain
   */
  domain?: string
  /**
   * Will restrict this cookie to only be sent with requests that contain this path
   */
  path?: string
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
