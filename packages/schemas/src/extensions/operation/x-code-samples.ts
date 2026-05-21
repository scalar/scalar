import { array, object, optional, string } from '@scalar/validation'

import { typeCommentInlineCode, typeCommentWithExample } from '../type-comment'

export const XCodeSample = object(
  {
    lang: optional(string({ typeComment: 'Programming language for syntax highlighting' })),
    label: optional(string({ typeComment: 'Label shown in the code sample picker' })),
    source: string({ typeComment: 'Source code for the sample' }),
  },
  {
    typeName: 'XCodeSample',
    typeComment: 'A single code sample for documentation or examples',
  },
)

export const XCodeSamples = object(
  {
    'x-codeSamples': optional(array(XCodeSample, { typeComment: 'Code samples (camelCase spelling)' })),
    'x-code-samples': optional(array(XCodeSample, { typeComment: 'Code samples (kebab-case spelling)' })),
    'x-custom-examples': optional(array(XCodeSample, { typeComment: 'Custom code examples for the operation' })),
  },
  {
    typeName: 'XCodeSamples',
    typeComment: typeCommentWithExample(
      `Code samples attached to an operation. Supports ${typeCommentInlineCode('x-codeSamples')}, ${typeCommentInlineCode('x-code-samples')}, and ${typeCommentInlineCode('x-custom-examples')}.`,
      {
        language: 'yaml',
        body: `x-code-samples:
  - lang: curl
    label: cURL
    source: curl https://api.example.com`,
      },
    ),
  },
)
