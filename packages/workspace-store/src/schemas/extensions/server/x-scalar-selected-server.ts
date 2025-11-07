import { Type } from '@scalar/typebox'

export const XScalarSelectedServerSchema = Type.Object({
  'x-scalar-selected-server': Type.Optional(Type.String()),
})

export type XScalarSelectedServer = {
  /** The URL of the currently selected server */
  'x-scalar-selected-server'?: string
}
