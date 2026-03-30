import { Type } from '@scalar/typebox'
import { boolean, object, optional } from '@scalar/validation'

export const XInternalSchema = Type.Object({
  'x-internal': Type.Optional(Type.Boolean()),
})

export type XInternal = {
  /** Extension to mark an entity as internal */
  'x-internal'?: boolean
}

export const XInternal = object(
  {
    'x-internal': optional(boolean({ typeComment: 'Extension to mark an entity as internal' })),
  },
  {
    typeName: 'XInternal',
    typeComment: 'Extension to mark an entity as internal',
  },
)
