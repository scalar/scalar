import { Type } from '@scalar/typebox'

export const XScalarIgnoreSchema = Type.Object({
  'x-scalar-ignore': Type.Optional(Type.Boolean()),
})
