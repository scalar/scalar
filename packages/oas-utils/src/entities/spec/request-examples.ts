import { nanoidSchema } from '@/entities/shared'
import { securitySchemeExampleValueSchema } from '@/entities/spec/security'
import { getRequestBodyFromOperation } from '@/spec-getters'
import { z } from 'zod'

import type { RequestParameter } from './parameters'
import type { Request } from './requests'

export const requestExampleParametersSchema = z.object({
  key: z.string().default(''),
  value: z.coerce.string().default(''),
  enabled: z.boolean().default(true),
  file: z.any().optional(),
  description: z.string().optional(),
  /** Params are linked to parents such as path params and global headers/cookies */
  refUid: nanoidSchema.optional(),
  required: z.boolean().optional(),
  enum: z.array(z.string()).optional(),
  type: z.string().optional(),
  format: z.string().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  default: z.any().optional(),
  nullable: z.boolean().optional(),
})

/** Request examples - formerly known as instances - are "children" of requests */
export type RequestExampleParameter = z.infer<
  typeof requestExampleParametersSchema
>

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

export const exampleRequestBodySchema = z.object({
  raw: z
    .object({
      encoding: z.enum(exampleRequestBodyEncoding).default('json'),
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

export const requestExampleSchema = z.object({
  type: z.literal('requestExample').optional().default('requestExample'),
  uid: nanoidSchema,
  requestUid: nanoidSchema,
  name: z.string().optional().default('Name'),
  body: exampleRequestBodySchema.optional().default({}),
  parameters: z
    .object({
      path: requestExampleParametersSchema.array().default([]),
      query: requestExampleParametersSchema.array().default([]),
      headers: requestExampleParametersSchema.array().default([]),
      cookies: requestExampleParametersSchema.array().default([]),
    })
    .optional()
    .default({}),
  /**
   * Map of security schemas to their value sets
   *
   * For each selected security schema we should have an entry here
   * The entry will contain the secret values (but not the schema definition)
   */
  auth: z.record(nanoidSchema, securitySchemeExampleValueSchema).default({}),
})

/** A single set 23of params for a request example */
export type RequestExample = z.infer<typeof requestExampleSchema>
export type RequestExamplePayload = z.input<typeof requestExampleSchema>

// ---------------------------------------------------------------------------
// Example Helpers

/** Create new instance parameter from a request parameter */
export function createParamInstance(param: RequestParameter) {
  const schema = param.schema as any

  /**
   * TODO:
   * - Need better value defaulting here
   * - Need to handle non-string parameters much better
   * - Need to handle unions/array values for schema
   */
  const value = String(schema.default ?? schema?.examples?.[0] ?? '')

  return requestExampleParametersSchema.parse({
    ...schema,
    key: param.name,
    value,
    description: param.description,
    required: param.required,
    /** Initialized all required properties to enabled */
    enabled: !!param.required,
  })
}

/**
 * Create new request example from a request
 * Iterates the name of the example if provided
 */
export function createExampleFromRequest(
  request: Request,
  name: string,
): RequestExample {
  // ---------------------------------------------------------------------------
  // Populate all parameters with an example value
  const parameters: Record<
    'path' | 'cookie' | 'header' | 'query',
    RequestExampleParameter[]
  > = {
    path: [],
    query: [],
    cookie: [],
    header: [],
  }

  // Populated the separated params
  request.parameters?.forEach((p) =>
    parameters[p.in].push(createParamInstance(p)),
  )

  // ---------------------------------------------------------------------------
  // Handle request body defaulting for various content type encodings
  const body: ExampleRequestBody = {
    activeBody: 'raw',
    raw: {
      encoding: 'json',
      value: '',
    },
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

    /**
     * TODO: How are handling form data examples from the spec
     */
    if (requestBody?.body?.mimeType === 'application/x-www-form-urlencoded') {
      body.activeBody = 'formData'
      body.formData = undefined
    }
  }
  const example = requestExampleSchema.parse({
    requestUid: request.uid,
    parameters,
    name,
    body,
  })

  return example
}
