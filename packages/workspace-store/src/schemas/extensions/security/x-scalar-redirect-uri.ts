import { Type } from '@sinclair/typebox'

export const XScalarRedirectUriSchema = Type.Object({
  'x-scalar-redirect-uri': Type.Optional(Type.String()),
})
