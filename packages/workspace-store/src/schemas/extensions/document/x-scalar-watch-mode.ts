import { Type } from '@scalar/typebox'

export const XScalarWatchModeSchema = Type.Object({
  /** Whether the document is in watch mode */
  'x-scalar-watch-mode': Type.Optional(Type.Boolean()),
})

export type XScalarWatchMode = {
  /** Whether the document is in watch mode */
  'x-scalar-watch-mode'?: boolean
}
