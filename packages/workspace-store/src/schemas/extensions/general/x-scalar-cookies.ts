import { Type } from '@scalar/typebox'
import { array, boolean, object, optional, string } from '@scalar/validation'

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

export const XScalarCookie = object(
  {
    name: string({ typeComment: 'Defines the cookie name and its value.' }),
    value: string({ typeComment: 'Defines the cookie value.' }),
    domain: optional(string({ typeComment: 'Allows this domain and all subdomains.' })),
    path: optional(string({ typeComment: 'Restricts this cookie to requests that contain this path.' })),
    isDisabled: optional(boolean({ typeComment: 'Indicates if the cookie is disabled.' })),
  },
  {
    typeName: 'XScalarCookie',
    typeComment: 'A persisted cookie definition for the workspace',
  },
)

export const xScalarCookiesSchema = Type.Object({
  'x-scalar-cookies': Type.Optional(Type.Array(xScalarCookieSchema)),
})

export type XScalarCookies = {
  'x-scalar-cookies'?: XScalarCookie[]
}

export const XScalarCookies = object(
  {
    'x-scalar-cookies': optional(
      array(XScalarCookie, {
        typeComment: 'Cookies persisted for the workspace',
      }),
    ),
  },
  {
    typeName: 'XScalarCookies',
    typeComment: 'Persisted workspace cookies',
  },
)
