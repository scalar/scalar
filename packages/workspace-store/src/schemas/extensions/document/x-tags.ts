import { Type } from '@scalar/typebox'

export const XTags = Type.Object({
  'x-tags': Type.Optional(Type.Array(Type.String())),
})

export type XTags = {
  'x-tags'?: string[]
}
