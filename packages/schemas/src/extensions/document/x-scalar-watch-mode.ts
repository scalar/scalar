import { boolean, object, optional } from '@scalar/validation'

export const XScalarWatchMode = object(
  {
    'x-scalar-watch-mode': optional(
      boolean({ typeComment: 'When true, the document is watched for external file changes' }),
    ),
  },
  {
    typeName: 'XScalarWatchMode',
    typeComment:
      'Whether the document is in watch mode (reloads when the source file changes).\n\n@example\n```yaml\nx-scalar-watch-mode: true\n```',
  },
)
