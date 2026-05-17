import { object, optional, string } from '@scalar/validation'

export const XScalarSelectedServer = object(
  {
    'x-scalar-selected-server': optional(string()),
  },
  {
    typeName: 'XScalarSelectedServer',
    typeComment: 'The selected server URL for the document',
  },
)
