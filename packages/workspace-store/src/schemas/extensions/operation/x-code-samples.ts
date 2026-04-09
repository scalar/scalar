import { Type } from '@scalar/typebox'
import { array, object, optional, string } from '@scalar/validation'

const XCodeSampleSchema = Type.Object({
  lang: Type.Optional(Type.String()),
  label: Type.Optional(Type.String()),
  source: Type.String(),
})

export const XCodeSamplesSchema = Type.Object({
  'x-codeSamples': Type.Optional(Type.Array(XCodeSampleSchema)),
  'x-code-samples': Type.Optional(Type.Array(XCodeSampleSchema)),
  'x-custom-examples': Type.Optional(Type.Array(XCodeSampleSchema)),
})

export type XCodeSample = {
  lang?: string
  label?: string
  source: string
}

export const XCodeSample = object(
  {
    lang: optional(string()),
    label: optional(string()),
    source: string(),
  },
  {
    typeName: 'XCodeSample',
    typeComment: 'A single code sample for documentation or examples',
  },
)

export type XCodeSamples = {
  'x-codeSamples'?: XCodeSample[]
  'x-code-samples'?: XCodeSample[]
  'x-custom-examples'?: XCodeSample[]
}

export const XCodeSamples = object(
  {
    'x-codeSamples': optional(array(XCodeSample)),
    'x-code-samples': optional(array(XCodeSample)),
    'x-custom-examples': optional(array(XCodeSample)),
  },
  {
    typeName: 'XCodeSamples',
    typeComment: 'Code samples attached to an operation',
  },
)
