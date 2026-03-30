import { Type } from '@scalar/typebox'
import { object, optional, string } from '@scalar/validation'

export const XVariableSchema = Type.Object({
  'x-variable': Type.Optional(Type.String()),
})

export type XVariable = {
  'x-variable'?: string
}

export const XVariable = object(
  {
    'x-variable': optional(string()),
  },
  {
    typeName: 'XVariable',
    typeComment: 'Variable reference for a schema property',
  },
)
