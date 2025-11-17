import { Type } from '@scalar/typebox'

/**
 * Schema for the "x-scalar-order" OpenAPI extension.
 * This extension allows specifying an optional array of strings,
 * which can be used to represent a custom order for elements (e.g., tags, operations) in the Scalar UI.
 */
export const XScalarOrderSchema = Type.Object({
  'x-scalar-order': Type.Optional(Type.Array(Type.String())),
})

export type XScalarOrder = {
  'x-scalar-order'?: string[]
}
