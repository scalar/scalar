import { Type, type Static } from '@sinclair/typebox'

export const xScalarClientConfigCookiesSchema = Type.Object({
  name: Type.String(),
  value: Type.String(),
  domain: Type.Optional(Type.String()),
  path: Type.Optional(Type.String()),
})

export type XScalarClientConfigCookies = Static<typeof xScalarClientConfigCookiesSchema>
