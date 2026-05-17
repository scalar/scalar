import { boolean, object, optional } from '@scalar/validation'

export const XScalarWatchMode = object(
  {
    'x-scalar-watch-mode': optional(boolean({ typeComment: 'Whether the document is in watch mode' })),
  },
  {
    typeName: 'XScalarWatchMode',
    typeComment: 'Whether the document is in watch mode',
  },
)
