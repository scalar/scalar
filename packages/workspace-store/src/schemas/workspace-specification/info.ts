import { Type } from '@scalar/typebox'

export const InfoSchema = Type.Object({
  title: Type.String(),
  description: Type.Optional(Type.String()),
})
