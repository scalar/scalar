import { Type } from '@scalar/typebox'

export const XCodeSampleSchema = Type.Object({
  lang: Type.Optional(Type.String()),
  label: Type.Optional(Type.String()),
  source: Type.String(),
})

export const XCodeSamplesSchema = Type.Object({
  'x-codeSamples': Type.Optional(Type.Array(XCodeSampleSchema)),
  'x-code-samples': Type.Optional(Type.Array(XCodeSampleSchema)),
  'x-custom-examples': Type.Optional(Type.Array(XCodeSampleSchema)),
})
