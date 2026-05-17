import { object, optional, record, string } from '@scalar/validation'

export const XScalarSelectedContentType = object(
  {
    'x-scalar-selected-content-type': optional(record(string(), string())),
  },
  {
    typeName: 'XScalarSelectedContentType',
    typeComment: 'Selected content type per media type key',
  },
)
