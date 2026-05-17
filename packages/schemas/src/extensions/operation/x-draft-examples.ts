import { array, object, optional, string } from '@scalar/validation'

export const XDraftExamples = object(
  {
    'x-draft-examples': optional(array(string())),
  },
  {
    typeName: 'XDraftExamples',
    typeComment: 'Draft example names for an operation',
  },
)
