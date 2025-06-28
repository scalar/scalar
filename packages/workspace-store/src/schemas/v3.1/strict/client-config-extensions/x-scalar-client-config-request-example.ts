import { Type, type Static } from '@sinclair/typebox'

export const exampleBodyMime = [
  'application/json',
  'text/plain',
  'text/html',
  'application/javascript',
  'application/xml',
  'application/yaml',
  'application/edn',
  'application/octet-stream',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  /** Used for direct files */
  'binary',
] as const

const xScalarFileValueSchema = Type.Union([
  Type.Object({
    url: Type.String(),
    base64: Type.Optional(Type.String()),
  }),
  Type.Null(),
])

export type XScalarFileValue = Static<typeof xScalarFileValueSchema>

const xScalarExampleBodySchema = Type.Object({
  encoding: Type.Union(exampleBodyMime.map((it) => Type.Literal(it))),
  content: Type.Union([Type.Record(Type.String(), Type.Any()), Type.String()]),
  file: Type.Optional(xScalarFileValueSchema),
})

export type XScalarExampleBody = Static<typeof xScalarExampleBodySchema>

const xScalarExampleParameterSchema = Type.Optional(Type.Record(Type.String(), Type.String()))

export type XScalarExampleParameter = Static<typeof xScalarExampleParameterSchema>

export const xScalarClientConfigRequestExampleSchema = Type.Object({
  name: Type.Optional(Type.String()),
  body: Type.Optional(xScalarExampleBodySchema),
  parameters: Type.Object({
    path: xScalarExampleParameterSchema,
    query: xScalarExampleParameterSchema,
    header: xScalarExampleParameterSchema,
    cookie: xScalarExampleParameterSchema,
  }),
})

export type XScalarClientConfigRequestExample = Static<typeof xScalarClientConfigRequestExampleSchema>
