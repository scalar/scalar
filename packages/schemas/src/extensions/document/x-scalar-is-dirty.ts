import { boolean, object, optional } from '@scalar/validation'

export const XScalarIsDirty = object(
  {
    'x-scalar-is-dirty': optional(
      boolean({
        typeComment: 'When true, the document has unsaved changes',
      }),
    ),
  },
  {
    typeName: 'XScalarIsDirty',
    typeComment:
      'Tracks whether the document has been modified since it was last saved.\n\n@example\n```yaml\nx-scalar-is-dirty: true\n```',
  },
)
