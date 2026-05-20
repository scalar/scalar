import { any, object, optional, record, string } from '@scalar/validation'

export const XExamples = object(
  {
    'x-examples': optional(
      record(string(), any(), {
        typeComment: 'Map of example name to example value',
      }),
    ),
  },
  {
    typeName: 'XExamples',
    typeComment:
      'Named examples attached to a schema. Keys are example names; values are the example payloads.\n\n@example\n```yaml\nx-examples:\n  user:\n    id: 1\n    name: Ada\n```',
  },
)
