import { Type } from '@scalar/typebox'
import { boolean, object, optional } from '@scalar/validation'

export const XScalarWatchModeSchema = Type.Object({
  /** Whether the document is in watch mode */
  'x-scalar-watch-mode': Type.Optional(Type.Boolean()),
})

export type XScalarWatchMode = {
  /** Whether the document is in watch mode */
  'x-scalar-watch-mode'?: boolean
}

export const XScalarWatchMode = object(
  {
    'x-scalar-watch-mode': optional(boolean({ typeComment: 'Whether the document is in watch mode' })),
  },
  {
    typeName: 'XScalarWatchMode',
    typeComment: 'Whether the document is in watch mode',
  },
)
