import { Type } from '@scalar/typebox'
import { number, object, optional } from '@scalar/validation'

/**
 * x-order
 *
 * Controls the display order of schema properties. Properties with `x-order` are
 * sorted by their numeric value (ascending) and shown before properties without it.
 */
export const XOrderSchema = Type.Object({
  'x-order': Type.Optional(Type.Number()),
})

export type XOrder = {
  /**
   * x-order
   *
   * Controls the display order of schema properties. Properties with `x-order` are
   * sorted by their numeric value (ascending) and shown before properties without it.
   */
  'x-order'?: number
}

export const XOrder = object(
  {
    'x-order': optional(number()),
  },
  {
    typeName: 'XOrder',
    typeComment: 'Display order for a schema property',
  },
)
