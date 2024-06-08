import { nanoidSchema } from '@/entities/workspace/shared'
import { REQUEST_METHODS, type RequestMethod } from '@/helpers'
import type { AxiosResponse } from 'axios'
import type { OpenAPIV3_1 } from 'openapi-types'
import { type ZodSchema, z } from 'zod'

import { $refSchema } from './refs'
import type { RequestExample } from './request-examples'

/** A single set of populated values for a sent request */
export type ResponseInstance = AxiosResponse

/** A single request/response set to save to the history stack */
export type RequestEvent = {
  request: RequestExample
  response: ResponseInstance
}

// TODO fill out body
type RequestBody = object
const requestBodySchema = z.any() satisfies ZodSchema<RequestBody>

export type Parameters = Record<string, OpenAPIV3_1.ParameterObject>
export const parametersSchema = z.record(z.string(), z.any())

/** Each operation in an OpenAPI file will correspond with a single request */
export type RequestRef = z.infer<typeof requestRefSchema> & {
  externalDocs?: OpenAPIV3_1.ExternalDocumentationObject
}

export const requestRefSchema = z.object({
  path: z.string(),
  method: z.enum(Object.keys(REQUEST_METHODS) as [RequestMethod]),
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
  /** Ordered exampleUids for the sidenav */
  examples: nanoidSchema.array().default([]),
  history: z.any().array().default([]),
})
