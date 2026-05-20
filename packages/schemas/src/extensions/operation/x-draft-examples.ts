import { array, object, optional, string } from '@scalar/validation'

export const XDraftExamples = object(
  {
    'x-draft-examples': optional(
      array(string(), {
        typeComment: 'Identifiers of draft examples attached to this operation',
      }),
    ),
  },
  {
    typeName: 'XDraftExamples',
    typeComment:
      'Draft example identifiers for an operation (in-progress examples not yet committed).\n\n@example\n```yaml\nx-draft-examples:\n  - default\n  - error-case\n```',
  },
)
