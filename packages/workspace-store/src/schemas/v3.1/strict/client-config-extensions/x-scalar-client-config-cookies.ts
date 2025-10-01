import { Type } from '@scalar/typebox'

export const xScalarClientConfigCookieSchema = Type.Object({
  name: Type.String(),
  value: Type.String(),
  domain: Type.Optional(Type.String()),
  path: Type.Optional(Type.String()),
})

export type XScalarClientConfigCookie = {
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
   * Indicates the path that must exist in the requested URL for the browser to send the Cookie header.
   */
  path?: string
}

export const xScalarClientConfigCookiesSchema = Type.Record(Type.String(), xScalarClientConfigCookieSchema)
export type XScalarClientConfigCookies = Record<string, XScalarClientConfigCookie>
