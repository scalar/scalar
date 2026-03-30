import { Type } from '@scalar/typebox'
import { array, object, optional, string } from '@scalar/validation'

export const XDraftExamplesSchema = Type.Object({
  'x-draft-examples': Type.Optional(Type.Array(Type.String())),
})

export type XDraftExamples = {
  'x-draft-examples'?: string[]
}

export const XDraftExamples = object(
  {
    'x-draft-examples': optional(array(string())),
  },
  {
    typeName: 'XDraftExamples',
    typeComment: 'Draft example identifiers for an operation',
  },
)
