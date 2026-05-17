import { boolean, object, optional } from '@scalar/validation'

export const XInternal = object(
  {
    'x-internal': optional(boolean({ typeComment: 'Extension to mark an entity as internal' })),
  },
  {
    typeName: 'XInternal',
    typeComment: 'Extension to mark an entity as internal',
  },
)
