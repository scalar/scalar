import { array, object, optional, record, string, union, unknown } from '@scalar/validation'

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

export const XReadmeCodeSample = object(
  {
    language: optional(string({ typeComment: 'Programming language for syntax highlighting' })),
    code: string({ typeComment: 'Source code for the sample' }),
    name: optional(string({ typeComment: 'Label shown in the code sample picker' })),
    install: optional(string({ typeComment: 'Installation instructions for the sample' })),
    correspondingExample: optional(string({ typeComment: 'Name of the response example this sample maps to' })),
  },
  {
    typeName: 'XReadmeCodeSample',
    typeComment: 'A single ReadMe custom code sample',
  },
)

export const XReadme = object(
  {
    'code-samples': optional(array(XReadmeCodeSample, { typeComment: 'ReadMe custom code samples' })),
    'samples-languages': optional(array(string(), { typeComment: 'Languages to generate code samples for' })),
  },
  {
    typeName: 'XReadme',
    typeComment: 'ReadMe extension object. Only code-samples carries source code.',
  },
)

export const XLanguageExample = object(
  {
    title: optional(string({ typeComment: 'Label shown in the code sample picker' })),
    request: optional(record(string(), string(), { typeComment: 'Source code keyed by programming language' })),
    response: optional(unknown({ typeComment: 'Example response for the request' })),
  },
  {
    typeName: 'XLanguageExample',
    typeComment: 'Per-language request snippets with an optional title and response',
  },
)

/** A single example or an array of examples, as used by x-stainless-examples and x-scalar-examples. */
const XLanguageExamples = union([XLanguageExample, array(XLanguageExample)])

export const XCodeSamples = object(
  {
    'x-codeSamples': optional(array(XCodeSample, { typeComment: 'Code samples (camelCase spelling)' })),
    'x-code-samples': optional(array(XCodeSample, { typeComment: 'Code samples (kebab-case spelling)' })),
    'x-custom-examples': optional(array(XCodeSample, { typeComment: 'Custom code examples for the operation' })),
    'x-readme': optional(XReadme),
    'x-stainless-snippets': optional(
      record(string(), string(), { typeComment: 'Stainless snippets, source code keyed by language' }),
    ),
    'x-stainless-examples': optional(XLanguageExamples),
    'x-scalar-examples': optional(XLanguageExamples),
  },
  {
    typeName: 'XCodeSamples',
    typeComment: typeCommentWithExample(
      `Code samples attached to an operation. Supports ${typeCommentInlineCode('x-codeSamples')}, ${typeCommentInlineCode('x-code-samples')}, ${typeCommentInlineCode('x-custom-examples')}, ${typeCommentInlineCode('x-readme')}, ${typeCommentInlineCode('x-stainless-snippets')}, ${typeCommentInlineCode('x-stainless-examples')}, and ${typeCommentInlineCode('x-scalar-examples')}.`,
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
