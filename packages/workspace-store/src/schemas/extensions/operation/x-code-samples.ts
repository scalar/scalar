import { Type } from '@scalar/typebox'
import { array, object, optional, record, string, union, unknown } from '@scalar/validation'

const XCodeSampleSchema = Type.Object({
  lang: Type.Optional(Type.String()),
  label: Type.Optional(Type.String()),
  source: Type.String(),
})

/** A single ReadMe custom code sample (`x-readme.code-samples`). */
const XReadmeCodeSampleSchema = Type.Object({
  language: Type.Optional(Type.String()),
  code: Type.String(),
  name: Type.Optional(Type.String()),
  install: Type.Optional(Type.String()),
  correspondingExample: Type.Optional(Type.String()),
})

/** ReadMe extension object. Only `code-samples` carries source code. */
const XReadmeSchema = Type.Object({
  'code-samples': Type.Optional(Type.Array(XReadmeCodeSampleSchema)),
  'samples-languages': Type.Optional(Type.Array(Type.String())),
})

/**
 * A Stainless/Scalar example: per-language request snippets, with an optional
 * title and response. Matches the shape of `x-stainless-examples`.
 */
const XLanguageExampleSchema = Type.Object({
  title: Type.Optional(Type.String()),
  request: Type.Optional(Type.Record(Type.String(), Type.String())),
  response: Type.Optional(Type.Unknown()),
})

/** A single example or an array of examples. */
const XLanguageExamplesSchema = Type.Union([XLanguageExampleSchema, Type.Array(XLanguageExampleSchema)])

export const XCodeSamplesSchema = Type.Object({
  'x-codeSamples': Type.Optional(Type.Array(XCodeSampleSchema)),
  'x-code-samples': Type.Optional(Type.Array(XCodeSampleSchema)),
  'x-custom-examples': Type.Optional(Type.Array(XCodeSampleSchema)),
  'x-readme': Type.Optional(XReadmeSchema),
  'x-stainless-snippets': Type.Optional(Type.Record(Type.String(), Type.String())),
  'x-stainless-examples': Type.Optional(XLanguageExamplesSchema),
  'x-scalar-examples': Type.Optional(Type.Array(XCodeSampleSchema)),
})

export type XCodeSample = {
  lang?: string
  label?: string
  source: string
}

/** A single ReadMe custom code sample. */
export type XReadmeCodeSample = {
  language?: string
  code: string
  name?: string
  install?: string
  correspondingExample?: string
}

/** Per-language request snippets with an optional title and response. */
export type XLanguageExample = {
  title?: string
  request?: Record<string, string>
  response?: unknown
}

export const XCodeSample = object({
  lang: optional(string()),
  label: optional(string()),
  source: string(),
})

const XReadmeCodeSample = object({
  language: optional(string()),
  code: string(),
  name: optional(string()),
  install: optional(string()),
  correspondingExample: optional(string()),
})

const XReadme = object({
  'code-samples': optional(array(XReadmeCodeSample)),
  'samples-languages': optional(array(string())),
})

const XLanguageExample = object({
  title: optional(string()),
  request: optional(record(string(), string())),
  response: optional(unknown()),
})

const XLanguageExamples = union([XLanguageExample, array(XLanguageExample)])

export type XCodeSamples = {
  'x-codeSamples'?: XCodeSample[]
  'x-code-samples'?: XCodeSample[]
  'x-custom-examples'?: XCodeSample[]
  'x-readme'?: {
    'code-samples'?: XReadmeCodeSample[]
    'samples-languages'?: string[]
  }
  'x-stainless-snippets'?: Record<string, string>
  'x-stainless-examples'?: XLanguageExample | XLanguageExample[]
  'x-scalar-examples'?: XCodeSample[]
}

export const XCodeSamples = object({
  'x-codeSamples': optional(array(XCodeSample)),
  'x-code-samples': optional(array(XCodeSample)),
  'x-custom-examples': optional(array(XCodeSample)),
  'x-readme': optional(XReadme),
  'x-stainless-snippets': optional(record(string(), string())),
  'x-stainless-examples': optional(XLanguageExamples),
  'x-scalar-examples': optional(array(XCodeSample)),
})
