import { nanoidSchema } from '@/entities/workspace/shared'
import { deepMerge } from '@/helpers'
import { z } from 'zod'

const requestExampleParametersSchema = z.object({
  key: z.string().default(''),
  value: z.union([z.string(), z.number()]).transform(String).default(''),
  enabled: z.boolean().default(true),
  file: z.instanceof(File).optional(),
  description: z.string().optional(),
  /** Params are linked to parents such as path params and global headers/cookies */
  refUid: nanoidSchema.optional(),
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
) => deepMerge(requestExampleParametersSchema.parse({}), payload)

const requestExampleSchema = z.object({
  uid: nanoidSchema,
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
      binary: z.instanceof(File).optional(),
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
    payload,
  )
