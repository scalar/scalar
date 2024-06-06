import { nanoidSchema } from '@/entities/workspace/shared'
import type { AxiosResponse } from 'axios'
import { nanoid } from 'nanoid'
import type { OpenAPIV3_1 } from 'openapi-types'
import { type ZodSchema, type ZodTypeDef, z } from 'zod'

import { type $REF, $refSchema } from './refs'

// ---------------------------------------------------------------------------
// Instances are a single payload sent or received from an http request

export type RequestInstanceParameter = {
  uid: string
  key: string
  value: string
  binary?: {
    file: File
    value: string
  }
  required: boolean
  enabled: boolean
  description: string
}

export const requestInstanceParametersSchema = z.object({
  uid: nanoidSchema,
  key: z.string().default(''),
  required: z.boolean().default(false),
  value: z.string().default(''),
  file: z.instanceof(File),
  description: z.string().default(''),
  enabled: z.boolean().default(false),
}) satisfies ZodSchema<RequestInstanceParameter, ZodTypeDef, any>

export const defaultRequestInstanceParameters =
  (): RequestInstanceParameter => ({
    uid: nanoid(),
    key: '',
    value: '',
    description: '',
    required: false,
    enabled: true,
  })

/** A single set of populated values for a sent request */
export type ResponseInstance = AxiosResponse

/** A single set of populated values for a sent request */
export type RequestInstance = {
  body: {
    raw: {
      encoding: 'text' | 'javascript' | 'html' | 'xml' | 'json' | 'yaml' | 'edn'
      value: string
    }
    formData: {
      encoding: 'form-data' | 'urlencoded'
      value: RequestInstanceParameter[]
    }
    binary?: {
      file: File
      value: string
    }
    activeBody: 'raw' | 'formData' | 'binary'
  }
  parameters: {
    path: RequestInstanceParameter[]
    query: RequestInstanceParameter[]
    headers: RequestInstanceParameter[]
    cookies: RequestInstanceParameter[]
  }
  url: string
  auth: any
}

export const defaultRequestInstance = (): RequestInstance => ({
  body: {
    raw: {
      encoding: 'json',
      value: '',
    },
    formData: {
      encoding: 'form-data',
      value: [],
    },
    activeBody: 'raw',
  },
  parameters: {
    path: [],
    query: [],
    headers: [],
    cookies: [],
  },
  url: '',
  auth: {},
})

/**
 * Create new instance parameter from a request parameter
 */
const createParamInstance = (param: OpenAPIV3_1.ParameterObject) => {
  const newParam = {
    ...defaultRequestInstanceParameters(),
    key: param.name,
    required: param.required ?? false,
    description: param.description ?? '',
  }

  // Grab some schema or base values
  if (param.schema && 'default' in param.schema)
    newParam.value = param.schema.default

  return newParam
}

/**
 * Create new request instance from a request
 *
 * TODO body
 */
export const createRequestInstance = (
  request: RequestRef,
  servers?: OpenAPIV3_1.ServerObject[],
): RequestInstance => {
  const parameters = {
    path: Object.values(request.parameters.path).map(createParamInstance),
    query: Object.values(request.parameters.query).map(createParamInstance),
    headers: Object.values(request.parameters.headers).map(createParamInstance),
    cookies: Object.values(request.parameters.cookies).map(createParamInstance),
  }

  // TODO body

  return {
    ...defaultRequestInstance(),
    parameters,
    url: servers?.[0].url + request.path.replace(/{(.*?)}/g, ':$1'),
  }
}

export const requestInstanceSchema = z.object({
  body: z.object({
    raw: z.object({
      encoding: z.union([
        z.literal('json'),
        z.literal('text'),
        z.literal('html'),
        z.literal('text'),
        z.literal('javascript'),
        z.literal('xml'),
        z.literal('yaml'),
        z.literal('edn'),
      ]),
      value: z.string().default(''),
    }),
    formData: z.object({
      encoding: z.union([z.literal('form-data'), z.literal('urlencoded')]),
      value: requestInstanceParametersSchema.array(),
    }),
    binary: z.any(),
    activeBody: z.union([
      z.literal('raw'),
      z.literal('formData'),
      z.literal('binary'),
    ]),
  }),
  bodyEncoding: z.string().default('json'),
  parameters: z.object({
    path: requestInstanceParametersSchema.array(),
    query: requestInstanceParametersSchema.array(),
    headers: requestInstanceParametersSchema.array(),
    cookies: requestInstanceParametersSchema.array(),
  }),
  url: z.string(),
  auth: z.record(z.string(), z.any()).default({}),
}) satisfies ZodSchema<RequestInstance, ZodTypeDef, any>

/** A single request/response set to save to the history stack */
export type RequestEvent = {
  request: RequestInstance
  response: ResponseInstance
}

// ---------------------------------------------------------------------------

type RequestBody = object

const requestBodySchema = z.any() satisfies ZodSchema<RequestBody>

export type Parameters = Record<string, OpenAPIV3_1.ParameterObject>
export const parametersSchema = z.record(z.string(), z.any())

/** Each operation in an OpenAPI file will correspond with a single request */
export type RequestRef = {
  path: string
  method: string
  uid: string
  ref: $REF | null
  /** Tags can be assigned and any tags that do not exist in the collection will be automatically created */
  tags: string[]
  summary?: string
  description?: string
  externalDocs?: OpenAPIV3_1.ExternalDocumentationObject
  operationId?: string
  requestBody?: RequestBody
  parameters: {
    path: Parameters
    query: Parameters
    headers: Parameters
    cookies: Parameters
  }
  values: RequestInstance[]
  history: RequestEvent[]
}

export const requestRefSchema = z.object({
  path: z.string(),
  method: z.string(),
  uid: z.string().min(7),
  ref: $refSchema.nullable(),
  tags: z.string().array(),
  summary: z.string().optional(),
  description: z.string().optional(),
  requestBody: requestBodySchema.optional(),
  parameters: z.object({
    path: parametersSchema,
    query: parametersSchema,
    headers: parametersSchema,
    cookies: parametersSchema,
  }),
  values: z.any().array(),
  history: z.any().array(),
}) satisfies ZodSchema<RequestRef>
