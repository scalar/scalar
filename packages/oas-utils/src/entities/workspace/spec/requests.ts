import { nanoidSchema } from '@/entities/workspace/shared'
import { iterateTitle } from '@/helpers'
import type { AxiosResponse } from 'axios'
import type { OpenAPIV3_1 } from 'openapi-types'
import { type ZodSchema, z } from 'zod'

import { $refSchema } from './refs'

/** Request examples - formerly known as instances - are "children" of requests */
export type RequestExampleParameter = z.TypeOf<
  typeof requestExampleParametersSchema
>
export const requestExampleParametersSchema = z.object({
  key: z.string().default(''),
  value: z.union([z.string(), z.number()]).transform(String).default(''),
  enabled: z.boolean().default(true),
  file: z.instanceof(File).optional(),
  /** Params are linked to parents such as path params and global headers/cookies */
  refUid: nanoidSchema.optional(),
})

/** A single set of populated values for a sent request */
export type ResponseInstance = AxiosResponse

/** A single set of params for a request example */
export type RequestExample = z.TypeOf<typeof requestExampleSchema>
export const requestExampleSchema = z.object({
  uid: nanoidSchema,
  requestUid: z.string().min(7),
  name: z.string(),
  body: z
    .object({
      raw: z
        .object({
          encoding: z
            .union([
              z.literal('json'),
              z.literal('text'),
              z.literal('html'),
              z.literal('text'),
              z.literal('javascript'),
              z.literal('xml'),
              z.literal('yaml'),
              z.literal('edn'),
            ])
            .default('json'),
          value: z.string().default(''),
        })
        .default({}),
      formData: z
        .object({
          encoding: z
            .union([z.literal('form-data'), z.literal('urlencoded')])
            .default('form-data'),
          value: requestExampleParametersSchema.array().default([]),
        })
        .default({}),
      binary: z.instanceof(File).optional(),
      activeBody: z
        .union([z.literal('raw'), z.literal('formData'), z.literal('binary')])
        .default('raw'),
    })
    .default({}),
  parameters: z.object({
    path: requestExampleParametersSchema.array().default([]),
    query: requestExampleParametersSchema.array().default([]),
    headers: requestExampleParametersSchema.array().default([]),
    cookies: requestExampleParametersSchema.array().default([]),
  }),
  auth: z.record(z.string(), z.any()).default({}),
})

/**
 * Create new instance parameter from a request parameter
 */
const createParamInstance = (param: OpenAPIV3_1.ParameterObject) =>
  requestExampleParametersSchema.parse({
    key: param.name,
    value:
      param.schema && 'default' in param.schema ? param.schema.default : '',
  })

/**
 * Create new request example from a request
 * Also iterates the name
 *
 * TODO body
 */
export const createRequestExample = (request: RequestRef): RequestExample => {
  const parameters = {
    path: Object.values(request.parameters.path).map(createParamInstance),
    query: Object.values(request.parameters.query).map(createParamInstance),
    headers: Object.values(request.parameters.headers).map(createParamInstance),
    cookies: Object.values(request.parameters.cookies).map(createParamInstance),
  }

  // TODO body

  const name = iterateTitle((request.summary ?? 'Example') + ' #1', (t) =>
    Object.values(request.examples).some(({ name: _name }) => t === _name),
  )

  const example = requestExampleSchema.parse({
    requestUid: request.uid,
    name,
    parameters,
  })

  return example
}

/**
 * Helper method to create new requests
 * Adds the first example as well
 */
export const createRequest = (params: Partial<RequestRef>) => {
  const request = requestRefSchema.parse(params)

  // Add initial example
  const example = createRequestExample(request)
  request.examples[example.uid] = example
  request.children.push(example.uid)

  return request
}

/** A single request/response set to save to the history stack */
export type RequestEvent = {
  request: RequestExample
  response: ResponseInstance
}

// ---------------------------------------------------------------------------

type RequestBody = object

const requestBodySchema = z.any() satisfies ZodSchema<RequestBody>

export type Parameters = Record<string, OpenAPIV3_1.ParameterObject>
export const parametersSchema = z.record(z.string(), z.any())

/** Each operation in an OpenAPI file will correspond with a single request */
export type RequestRef = z.TypeOf<typeof requestRefSchema> & {
  externalDocs?: OpenAPIV3_1.ExternalDocumentationObject
}
export const requestRefSchema = z.object({
  path: z.string(),
  method: z.string(),
  uid: nanoidSchema,
  ref: $refSchema.nullable().default(null),
  /** Tags can be assigned and any tags that do not exist in the collection will be automatically created */
  tags: z.string().array(),
  summary: z.string().optional(),
  description: z.string().optional(),
  operationId: z.string().optional(),
  requestBody: requestBodySchema.optional(),
  parameters: z
    .object({
      path: parametersSchema,
      query: parametersSchema,
      headers: parametersSchema,
      cookies: parametersSchema,
    })
    .default({ path: {}, query: {}, headers: {}, cookies: {} }),
  examples: z.record(nanoidSchema, requestExampleSchema).default({}),
  /** Ordered exampleUids for the sidenav */
  children: nanoidSchema.array().default([]),
  history: z.any().array().default([]),
  baseUrl: z.string().optional(),
})
