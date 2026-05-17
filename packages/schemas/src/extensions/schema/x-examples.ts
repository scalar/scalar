import { any, object, optional, record, string } from '@scalar/validation'

export const XExamples = object(
  {
    'x-examples': optional(record(string(), any())),
  },
  {
    typeName: 'XExamples',
    typeComment: 'Named examples for a schema',
  },
)
