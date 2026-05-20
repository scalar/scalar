import { boolean, object, optional } from '@scalar/validation'

export const XInternal = object(
  {
    'x-internal': optional(boolean({ typeComment: 'When true, hides the entity from public documentation' })),
  },
  {
    typeName: 'XInternal',
    typeComment:
      'Marks an entity as internal (hidden from external consumers).\n\n@example\n```yaml\nx-internal: true\n```',
  },
)
