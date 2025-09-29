import { Type } from '@scalar/typebox'

export const XScalarIconSchema = Type.Object({
  'x-scalar-icon': Type.Optional(Type.String()),
})

export type XScalarIcon = {
  /** A custom icon representing the collection */
  'x-scalar-icon'?: string
}
