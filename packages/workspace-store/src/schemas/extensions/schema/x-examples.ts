import { Type } from '@scalar/typebox'
import { any, object, optional, record, string } from '@scalar/validation'

export const XExamplesSchema = Type.Object({
  'x-examples': Type.Optional(Type.Record(Type.String(), Type.Unknown())),
})

export type XExamples = {
  /**
   * This is based on one example of x-examples we have seen where it is a record of example name to example value.
   */
  'x-examples'?: Record<string, unknown>
}

export const XExamples = object(
  {
    'x-examples': optional(record(string(), any())),
  },
  {
    typeName: 'XExamples',
    typeComment: 'Named examples attached to a schema',
  },
)
