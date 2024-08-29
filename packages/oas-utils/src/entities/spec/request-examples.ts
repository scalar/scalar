import { nanoidSchema } from '@/entities/shared'
import { securitySchemeExampleValueSchema } from '@/entities/spec/security'
import { z } from 'zod'

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
