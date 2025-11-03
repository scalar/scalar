import { Type } from '@scalar/typebox'

export const XScalarSelectedContentTypeSchema = Type.Object({
  'x-scalar-selected-content-type': Type.Optional(Type.Record(Type.String(), Type.String())),
})

export type XScalarSelectedContentType = {
  'x-scalar-selected-content-type'?: {
    [key: string]: string
  }
}
