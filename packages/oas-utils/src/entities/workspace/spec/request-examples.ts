import { nanoidSchema } from '@/entities/workspace/shared'
import { deepMerge } from '@scalar/object-utils/merge'
import { z } from 'zod'

// Define the Blob schema
export const blobSchema = z.object({
  size: z.number().nonnegative('Blob size must be a non-negative number').int(), // Size of the Blob
  type: z.string(), // MIME type of the Blob
  arrayBuffer: z.function().returns(z.promise(z.instanceof(ArrayBuffer))), // Returns a Promise of ArrayBuffer
  slice: z
    .function()
    .args(z.number().optional(), z.number().optional(), z.string().optional())
    .returns(z.any()), // Returns a Blob (any type for now)
  stream: z.function().returns(z.instanceof(ReadableStream<Uint8Array>)), // Returns a ReadableStream of Uint8Array
  text: z.function().returns(z.promise(z.string())), // Returns a Promise of string
})

const fileSchema = z
  .object({
    name: z.string(),
    lastModified: z.number(),
    webkitRelativePath: z.string(),
  })
  .extend(blobSchema.shape)

export type FileType = z.infer<typeof fileSchema>

const requestExampleParametersSchema = z.object({
  key: z.string().default(''),
  value: z.union([z.string(), z.number()]).transform(String).default(''),
  enabled: z.boolean().default(true),
  file: fileSchema.optional(),
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
export type RequestExampleParameterPayload = z.input<
  typeof requestExampleParametersSchema
>

/** Create request example parameter helper */
export const createRequestExampleParameter = (
  payload: RequestExampleParameterPayload,
) =>
  deepMerge(
    requestExampleParametersSchema.parse({}),
    payload as Partial<RequestExampleParameter>,
  )

const requestExampleSchema = z.object({
  uid: nanoidSchema,
  url: z.string().optional().default(''),
  requestUid: z.string().min(7),
  name: z.string().optional().default('Name'),
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
      binary: fileSchema.optional(),
      activeBody: z
        .union([z.literal('raw'), z.literal('formData'), z.literal('binary')])
        .default('raw'),
    })
    .optional()
    .default({}),
  parameters: z
    .object({
      path: requestExampleParametersSchema.array().default([]),
      query: requestExampleParametersSchema.array().default([]),
      headers: requestExampleParametersSchema.array().default([]),
      cookies: requestExampleParametersSchema.array().default([]),
    })
    .optional()
    .default({}),
  auth: z.record(z.string(), z.any()).default({}),
})

/** A single set of params for a request example */
export type RequestExample = z.infer<typeof requestExampleSchema>
export type RequestExamplePayload = z.input<typeof requestExampleSchema>

/** Create request example helper */
export const createRequestExample = (payload: RequestExamplePayload) =>
  deepMerge(
    requestExampleSchema.parse({ requestUid: payload.requestUid }),
    payload as Partial<RequestExample>,
  )
