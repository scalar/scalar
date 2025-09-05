import { Type } from '@scalar/typebox'

export const XScalarRedirectUriSchema = Type.Object({
  'x-scalar-redirect-uri': Type.Optional(Type.String()),
})
