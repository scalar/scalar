import { Type } from '@scalar/typebox'

export const XInternalSchema = Type.Object({
  'x-internal': Type.Optional(Type.Boolean()),
})
