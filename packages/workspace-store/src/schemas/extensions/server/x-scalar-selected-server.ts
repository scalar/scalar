import { Type } from '@scalar/typebox'
import { object, optional, string } from '@scalar/validation'

export const XScalarSelectedServerSchema = Type.Object({
  'x-scalar-selected-server': Type.Optional(Type.String()),
})

export type XScalarSelectedServer = {
  /** The URL of the currently selected server */
  'x-scalar-selected-server'?: string
}

export const XScalarSelectedServer = object(
  {
    'x-scalar-selected-server': optional(string({ typeComment: 'The URL of the currently selected server' })),
  },
  {
    typeName: 'XScalarSelectedServer',
    typeComment: 'The URL of the currently selected server',
  },
)
