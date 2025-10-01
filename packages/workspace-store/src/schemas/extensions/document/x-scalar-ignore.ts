import { Type } from '@scalar/typebox'

export const XScalarIgnoreSchema = Type.Object({
  'x-scalar-ignore': Type.Optional(Type.Boolean()),
})

export type XScalarIgnore = {
  /** Interal extension to mark an entity as ignored */
  'x-scalar-ignore'?: boolean
}
