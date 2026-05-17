import { array, object, optional, string } from '@scalar/validation'

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
