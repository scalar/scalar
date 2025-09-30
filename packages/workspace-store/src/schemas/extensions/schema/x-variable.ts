import { Type } from '@scalar/typebox'

export const XVariableSchema = Type.Object({
  'x-variable': Type.Optional(Type.String()),
})

export type XVariable = {
  'x-variable'?: string
}
