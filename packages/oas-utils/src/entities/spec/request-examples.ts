import { nanoidSchema } from '@/entities/shared'
import { schemaModel } from '@/helpers'
import {
  getRequestBodyFromOperation,
  getServerVariableExamples,
} from '@/spec-getters'
import { keysOf } from '@scalar/object-utils/arrays'
import { z } from 'zod'

import type { RequestParameter } from './parameters'
import type { Request } from './requests'
import type { Server } from './server'

// ---------------------------------------------------------------------------
// Example Parameters

/**
 * TODO: Deprecate this.
 *
 * The request schema should be stored in the request and any
 * parameters should be validated against that
 */
export const requestExampleParametersSchema = z.object({
  key: z.string().default(''),
  value: z.coerce.string().default(''),
  enabled: z.boolean().default(true),
  file: z.any().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  enum: z.array(z.string()).optional(),
  examples: z.array(z.string()).optional(),
  type: z.string().optional(),
  format: z.string().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  default: z.any().optional(),
  nullable: z.boolean().optional(),
})

/** Convert the array of parameters to an object keyed by the parameter name */
function parameterArrayToObject(params: RequestExampleParameter[]) {
  return params.reduce<Record<string, string>>((map, param) => {
    map[param.key] = param.value
    return map
  }, {})
}

/** Request examples - formerly known as instances - are "children" of requests */
export type RequestExampleParameter = z.infer<
  typeof requestExampleParametersSchema
>

export const xScalarFileValueSchema = z
  .object({
    url: z.string(),
    base64: z.string().optional(),
  })
  .nullable()

/**
 * When files are required for an example we provide the options
 * to provide a public URL or a base64 encoded string
 */
export type XScalarFileValue = z.infer<typeof xScalarFileValueSchema>

/**
 * Schema for the OAS serialization of request example parameters
 *
 * File values can be optionally fetched on import OR inserted as a base64 encoded string
 */
export const xScalarFormDataValue = z.union([
  z.object({
    type: z.literal('string'),
    value: z.string(),
  }),
  z.object({
    type: z.literal('file'),
    file: xScalarFileValueSchema,
  }),
])

export type XScalarFormDataValue = z.infer<typeof xScalarFormDataValue>

// ---------------------------------------------------------------------------
// Example Body

/**
 * Possible encodings for example request bodies when using text formats
 *
 * TODO: This list may not be comprehensive enough
 */
export const exampleRequestBodyEncoding = [
  'json',
  'text',
  'html',
  'javascript',
  'xml',
  'yaml',
  'edn',
] as const

export type BodyEncoding = (typeof exampleRequestBodyEncoding)[number]

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

export type BodyMime = (typeof exampleBodyMime)[number]

const contentMapping: Record<BodyEncoding, BodyMime> = {
  json: 'application/json',
  text: 'text/plain',
  html: 'text/html',
  javascript: 'application/javascript',
  xml: 'application/xml',
  yaml: 'application/yaml',
  edn: 'application/edn',
} as const

/**
 * TODO: Migrate away from this layout to the format used in the extension
 *
 * If a user changes the encoding of the body we expect the content to change as well
 */
export const exampleRequestBodySchema = z.object({
  raw: z
    .object({
      encoding: z.enum(exampleRequestBodyEncoding),
      value: z.string().default(''),
    })
    .optional(),
  formData: z
    .object({
      encoding: z
        .union([z.literal('form-data'), z.literal('urlencoded')])
        .default('form-data'),
      value: requestExampleParametersSchema.array().default([]),
    })
    .optional(),
  binary: z.instanceof(Blob).optional(),
  activeBody: z
    .union([z.literal('raw'), z.literal('formData'), z.literal('binary')])
    .default('raw'),
})

export type ExampleRequestBody = z.infer<typeof exampleRequestBodySchema>

/** Schema for the OAS serialization of request example bodies */
export const xScalarExampleBodySchema = z.object({
  encoding: z.enum(exampleBodyMime),
  /**
   * Body content as an object with a separately specified encoding or a simple pre-encoded string value
   *
   * Ideally we would convert any objects into the proper encoding on import
   */
  content: z.union([z.record(z.string(), z.any()), z.string()]),
  /** When the encoding is `binary` this will be used to link to the file */
  file: xScalarFileValueSchema.optional(),
})

export type XScalarExampleBody = z.infer<typeof xScalarExampleBodySchema>

// ---------------------------------------------------------------------------
// Example Schema

export const requestExampleSchema = z.object({
  uid: nanoidSchema,
  type: z.literal('requestExample').optional().default('requestExample'),
  requestUid: nanoidSchema,
  name: z.string().optional().default('Name'),
  body: exampleRequestBodySchema.optional().default({}),
  parameters: z
    .object({
      path: requestExampleParametersSchema.array().default([]),
      query: requestExampleParametersSchema.array().default([]),
      headers: requestExampleParametersSchema
        .array()
        .default([{ key: 'Accept', value: '*/*', enabled: true }]),
      cookies: requestExampleParametersSchema.array().default([]),
    })
    .optional()
    .default({}),
  /** TODO: Should this be deprecated? */
  serverVariables: z.record(z.string(), z.array(z.string())).optional(),
})

export type RequestExample = z.infer<typeof requestExampleSchema>

/** For OAS serialization we just store the simple key/value pairs */
const xScalarExampleParameterSchema = z
  .record(z.string(), z.string())
  .optional()

/** Schema for the OAS serialization of request examples */
export const xScalarExampleSchema = z.object({
  /** TODO: Should this be required? */
  name: z.string().optional(),
  body: xScalarExampleBodySchema.optional(),
  parameters: z.object({
    path: xScalarExampleParameterSchema,
    query: xScalarExampleParameterSchema,
    headers: xScalarExampleParameterSchema,
    cookies: xScalarExampleParameterSchema,
  }),
})

export type XScalarExample = z.infer<typeof xScalarExampleSchema>

/**
 * Convert a request example to the xScalar serialized format
 *
 * TODO: The base format should be migrated to align MUCH closer to the serialized format
 */
export function convertExampleToXScalar(example: RequestExample) {
  const active = example.body?.activeBody

  const xScalarBody: XScalarExampleBody = {
    encoding: 'text/plain',
    content: '',
  }

  if (example.body?.activeBody === 'binary') {
    xScalarBody.encoding = 'binary'
    // TODO: Need to allow users to set these properties
    xScalarBody.file = null
  }

  if (active === 'formData' && example.body?.[active]) {
    const body = example.body[active]
    xScalarBody.encoding =
      body.encoding === 'form-data'
        ? 'multipart/form-data'
        : 'application/x-www-form-urlencoded'

    // TODO: Need to allow users to set these properties
    xScalarBody.content = body.value.reduce<
      Record<string, XScalarFormDataValue>
    >((map, param) => {
      /** TODO: We need to ensure only file or value is set */
      map[param.key] = param.file
        ? {
            type: 'file',
            file: null,
          }
        : {
            type: 'string',
            value: param.value,
          }
      return map
    }, {})
  }

  if (example.body?.activeBody === 'raw') {
    xScalarBody.encoding =
      contentMapping[example.body.raw?.encoding ?? 'text'] ?? 'text/plain'

    xScalarBody.content = example.body.raw?.value ?? ''
  }

  const parameters: XScalarExample['parameters'] = {}

  keysOf(example.parameters ?? {}).forEach((key) => {
    if (example.parameters?.[key].length) {
      parameters[key] = parameterArrayToObject(example.parameters[key])
    }
  })

  return xScalarExampleSchema.parse({
    /** Only add the body if we have content or the body should be a file */
    body:
      xScalarBody.content || xScalarBody.encoding === 'binary'
        ? xScalarBody
        : undefined,
    parameters,
  })
}

// ---------------------------------------------------------------------------
// Example Helpers

/** Create new instance parameter from a request parameter */
export function createParamInstance(param: RequestParameter) {
  const schema = param.schema as any
  const keys = Object.keys(param?.examples ?? {})
  const firstExample = keys.length ? param.examples?.[keys[0]!] : null

  /**
   * TODO:
   * - Need better value defaulting here
   * - Need to handle non-string parameters much better
   * - Need to handle unions/array values for schema
   */
  const value = String(
    schema?.default ??
      schema?.examples?.[0] ??
      schema?.example ??
      firstExample?.value ??
      param.example ??
      '',
  )

  // Handle non-string enums and enums within items for array types
  const parseEnum =
    schema?.enum && schema?.type !== 'string'
      ? schema.enum?.map(String)
      : schema?.items?.enum && schema?.type === 'array'
        ? schema.items.enum.map(String)
        : schema?.enum

  // Handle non-string examples
  const parseExamples =
    schema?.examples && schema?.type !== 'string'
      ? schema.examples?.map(String)
      : schema?.examples

  // safe parse the example
  const example = schemaModel(
    {
      ...schema,
      key: param.name,
      value,
      description: param.description,
      required: param.required,
      /** Initialized all required properties to enabled */
      enabled: !!param.required,
      enum: parseEnum,
      examples: parseExamples,
    },
    requestExampleParametersSchema,
    false,
  )

  if (!example) {
    console.warn(`Example at ${param.name} is invalid.`)
    return requestExampleParametersSchema.parse({})
  } else return example
}

/**
 * Create new request example from a request
 * Iterates the name of the example if provided
 */
export function createExampleFromRequest(
  request: Request,
  name: string,
  server?: Server,
): RequestExample {
  // ---------------------------------------------------------------------------
  // Populate all parameters with an example value
  const parameters: Record<
    'path' | 'cookie' | 'header' | 'query' | 'headers',
    RequestExampleParameter[]
  > = {
    path: [],
    query: [],
    cookie: [],
    // deprecated TODO: add zod transform to remove
    header: [],
    headers: [{ key: 'Accept', value: '*/*', enabled: true }],
  }

  // Populated the separated params
  request.parameters?.forEach((p) =>
    parameters[p.in].push(createParamInstance(p)),
  )

  // TODO: add zod transform to remove header and only support headers
  if (parameters.header.length > 0) {
    parameters.headers = parameters.header
    parameters.header = []
  }

  // ---------------------------------------------------------------------------
  // Handle request body defaulting for various content type encodings
  const body: ExampleRequestBody = {
    activeBody: 'raw',
  }

  if (request.requestBody) {
    const requestBody = getRequestBodyFromOperation({
      path: request.path,
      information: {
        requestBody: request.requestBody,
      },
    })

    if (requestBody?.body?.mimeType === 'application/json') {
      body.activeBody = 'raw'
      body.raw = {
        encoding: 'json',
        value: requestBody.body.text ?? JSON.stringify({}),
      }
    }

    if (requestBody?.body?.mimeType === 'application/xml') {
      body.activeBody = 'raw'
      body.raw = {
        encoding: 'xml',
        value: requestBody.body.text ?? '',
      }
    }

    /**
     *  TODO: Are we loading example files from somewhere based on the spec?
     *  How are we handling the body values
     */
    if (requestBody?.body?.mimeType === 'application/octet-stream') {
      body.activeBody = 'binary'
      body.binary = undefined
    }

    if (
      requestBody?.body?.mimeType === 'application/x-www-form-urlencoded' ||
      requestBody?.body?.mimeType === 'multipart/form-data'
    ) {
      body.activeBody = 'formData'
      body.formData = {
        encoding:
          requestBody.body.mimeType === 'application/x-www-form-urlencoded'
            ? 'urlencoded'
            : 'form-data',
        value: (requestBody.body.params || []).map((param) => ({
          key: param.name,
          value: param.value || '',
          enabled: true,
        })),
      }
    }
  }

  const serverVariables = server ? getServerVariableExamples(server) : {}

  // safe parse the example
  const example = schemaModel(
    {
      requestUid: request.uid,
      parameters,
      name,
      body,
      serverVariables,
    },
    requestExampleSchema,
    false,
  )

  if (!example) {
    console.warn(`Example at ${request.uid} is invalid.`)
    return requestExampleSchema.parse({})
  } else return example
}
