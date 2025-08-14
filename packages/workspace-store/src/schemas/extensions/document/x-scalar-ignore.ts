import { Type } from '@sinclair/typebox'

export const XScalarIgnoreSchema = Type.Object({
  'x-scalar-ignore': Type.Optional(Type.Boolean()),
})
