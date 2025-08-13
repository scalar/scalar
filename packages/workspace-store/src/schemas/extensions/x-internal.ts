import { Type } from '@sinclair/typebox'

export const XInternalSchema = Type.Object({
  'x-internal': Type.Optional(Type.Boolean()),
})
