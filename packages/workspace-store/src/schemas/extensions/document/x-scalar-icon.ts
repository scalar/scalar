import { Type } from '@scalar/typebox'
import { object, optional, string } from '@scalar/validation'

export const XScalarIconSchema = Type.Object({
  'x-scalar-icon': Type.Optional(Type.String()),
})

export type XScalarIcon = {
  /** A custom icon representing the collection */
  'x-scalar-icon'?: string
}

export const XScalarIcon = object(
  {
    'x-scalar-icon': optional(string()),
  },
  {
    typeName: 'XScalarIcon',
    typeComment: 'A custom icon representing the collection',
  },
)
