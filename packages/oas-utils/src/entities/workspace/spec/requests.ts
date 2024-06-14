import { nanoidSchema } from '@/entities/workspace/shared'
import { REQUEST_METHODS, type RequestMethod, deepMerge } from '@/helpers'
import type { AxiosResponse } from 'axios'
import type { OpenAPIV3_1 } from 'openapi-types'
import { type ZodSchema, z } from 'zod'

import { $refSchema } from './refs'
import type { RequestExample } from './request-examples'

/** A single set of populated values for a sent request */
export type ResponseInstance = AxiosResponse & {
  /**
   * Time in ms the request took
   **/
  duration: number
}

/** A single request/response set to save to the history stack */
export type RequestEvent = {
  request: RequestExample
  response: ResponseInstance
}

// TODO fill out body
type RequestBody = object
const requestBodySchema = z.any() satisfies ZodSchema<RequestBody>

const parametersSchema = z.record(z.string(), z.any())

const requestSchema = z.object({
  path: z.string().optional().default('/'),
  method: z
    .enum(Object.keys(REQUEST_METHODS) as [RequestMethod])
    .optional()
    .default('GET'),
  uid: nanoidSchema,
  ref: $refSchema.nullable().default(null),
  /** A list of tags for API documentation control. Tags can be used for logical
   * grouping of operations by resources or any other qualifier.
   */
  tags: z.string().array().default(['default']),
  /** A short summary of what the operation does. */
  summary: z.string().optional(),
  /** A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation. */
  description: z.string().optional(),
  /** Unique string used to identify the operation. The id MUST be unique among all operations described in the API.
   * The operationId value is case-sensitive. Tools and libraries MAY use the operationId to uniquely identify an
   * operation, therefore, it is RECOMMENDED to follow bin common programming naming conventions./
   */
  operationId: z.string().optional(),
  parameters: z
    .object({
      path: parametersSchema,
      query: parametersSchema,
      headers: parametersSchema,
      cookies: parametersSchema,
    })
    .default({ path: {}, query: {}, headers: {}, cookies: {} }),
  /**
   * The request body applicable for this operation. The requestBody is fully supported in HTTP methods where the
   * HTTP 1.1 specification [RFC7231] has explicitly defined semantics for request bodies. In other cases where the
   * HTTP spec is vague (such as GET, HEAD and DELETE), requestBody is permitted but does not have well-defined
   * semantics and SHOULD be avoided if possible.
   */
  requestBody: requestBodySchema.optional(),
  /** Ordered exampleUids for the sidenav */
  childUids: nanoidSchema.array().default([]),
  history: z.any().array().default([]),
})

/**
 * Each operation in an OpenAPI file will correspond with a single request
 *
 * @see https://spec.openapis.org/oas/v3.1.0#operation-object
 */
export type Request = z.infer<typeof requestSchema> & {
  externalDocs?: OpenAPIV3_1.ExternalDocumentationObject
}
export type RequestPayload = z.input<typeof requestSchema> & {
  externalDocs?: OpenAPIV3_1.ExternalDocumentationObject
}

/** Create request helper */
export const createRequest = (payload: RequestPayload) =>
  deepMerge(requestSchema.parse({}), payload)
