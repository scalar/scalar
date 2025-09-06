import { type Static, Type } from '@scalar/typebox'

export const xScalarClientConfigCookieSchema = Type.Object({
  name: Type.String(),
  value: Type.String(),
  domain: Type.Optional(Type.String()),
  path: Type.Optional(Type.String()),
})

export type XScalarClientConfigCookie = Static<typeof xScalarClientConfigCookieSchema>

export const xScalarClientConfigCookiesSchema = Type.Record(Type.String(), xScalarClientConfigCookieSchema)
export type XScalarClientConfigCookies = Static<typeof xScalarClientConfigCookiesSchema>
