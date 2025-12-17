import { Type } from '@scalar/typebox'

export const XExamplesSchema = Type.Object({
  'x-examples': Type.Optional(Type.Record(Type.String(), Type.Unknown())),
})

export type XExamples = {
  /**
   * This is based on one example of x-examples we have seen where it is a record of example name to example value.
   */
  'x-examples'?: Record<string, unknown>
}
