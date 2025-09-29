import { Type } from '@scalar/typebox'

export const XInternalSchema = Type.Object({
  'x-internal': Type.Optional(Type.Boolean()),
})

export type XInternal = {
  /** Extension to mark an entity as internal */
  'x-internal'?: boolean
}
