import { Type } from '@sinclair/typebox'

export const XVariableSchema = Type.Object({
  'x-variable': Type.Optional(Type.String()),
})
