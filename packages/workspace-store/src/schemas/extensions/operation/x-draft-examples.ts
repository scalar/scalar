import { Type } from '@scalar/typebox'

export const XDraftExamplesSchema = Type.Object({
  'x-draft-examples': Type.Optional(Type.Array(Type.String())),
})

export type XDraftExamples = {
  'x-draft-examples'?: string[]
}
