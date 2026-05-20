import { boolean, object, optional } from '@scalar/validation'

/** Internal extension to mark an entity as ignored in the Scalar UI */
export const XScalarIgnore = object(
  {
    'x-scalar-ignore': optional(boolean({ typeComment: 'When true, the entity is hidden or ignored in the UI' })),
  },
  {
    typeName: 'XScalarIgnore',
    typeComment:
      'Internal extension to mark an entity as ignored in the Scalar UI.\n\n@example\n```yaml\nx-scalar-ignore: true\n```',
  },
)
