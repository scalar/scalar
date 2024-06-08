import { nanoidSchema } from '@/entities/workspace/shared'
import { iterateTitle } from '@/helpers'
import type { OpenAPIV3_1 } from 'openapi-types'
import { z } from 'zod'

import type { RequestRef } from './requests'

/** Request examples - formerly known as instances - are "children" of requests */
export type RequestExampleParameter = z.infer<
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
export const createRequestExample = (
  request: RequestRef,
  examples: Record<string, RequestExample>,
): RequestExample => {
  const parameters = {
    path: Object.values(request.parameters.path).map(createParamInstance),
    query: Object.values(request.parameters.query).map(createParamInstance),
    headers: Object.values(request.parameters.headers).map(createParamInstance),
    cookies: Object.values(request.parameters.cookies).map(createParamInstance),
  }

  // TODO body

  // Check all current examples for the title and iterate
  const name = iterateTitle((request.summary ?? 'Example') + ' #1', (t) =>
    request.examples.some((uid) => t === examples[uid].name),
  )

  const example = requestExampleSchema.parse({
    requestUid: request.uid,
    name,
    parameters,
  })

  return example
}

/** A single set of params for a request example */
export type RequestExample = z.infer<typeof requestExampleSchema>
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
