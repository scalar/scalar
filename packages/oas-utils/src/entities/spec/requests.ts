import { nanoidSchema } from '@/entities/shared'
import { oasExternalDocumentationSchema } from '@/entities/spec/spec-objects'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { type ZodSchema, z } from 'zod'

import { oasParameterSchema } from './parameters'
import type { RequestExample } from './request-examples'
import { oasSecurityRequirementSchema } from './security'

export const requestMethods = [
  'connect',
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
  'trace',
] as const

export type RequestMethod = (typeof requestMethods)[number]

/** A single set of populated values for a sent request */
export type ResponseInstance = Omit<Response, 'headers'> & {
  /** Store headers as an object to match what we had with axios */
  headers: Record<string, string>
  /** Keys of headers which set cookies */
  cookieHeaderKeys: string[]
  /** Time in ms the request took */
  duration: number
  /** The response data */
  data: unknown
}

/** A single request/response set to save to the history stack */
export type RequestEvent = {
  request: RequestExample
  response: ResponseInstance
  timestamp: number
}

// TODO: Type body definitions
type RequestBody = object
const requestBodySchema = z.any() satisfies ZodSchema<RequestBody>

/** Open API Compliant Request Validator */
export const oasRequestSchema = z.object({
  /**
   * A list of tags for API documentation control. Tags can be used for logical
   * grouping of operations by resources or any other qualifier.
   */
  tags: z.string().array().optional(),
  /** A short summary of what the operation does. */
  summary: z.string().optional(),
  /** A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation. */
  description: z.string().optional(),
  /**
   * Unique string used to identify the operation. The id MUST be unique among all operations described in the API.
   * The operationId value is case-sensitive. Tools and libraries MAY use the operationId to uniquely identify an
   * operation, therefore, it is RECOMMENDED to follow bin common programming naming conventions./
   */
  operationId: z.string().optional(),
  /**
   * A declaration of which security mechanisms can be used across the API. The list of
   * values includes alternative security requirement objects that can be used. Only
   * one of the security requirement objects need to be satisfied to authorize a request.
   * Individual operations can override this definition. To make security optional, an empty
   * security requirement ({}) can be included in the array.
   */
  security: z.array(oasSecurityRequirementSchema).optional(),
  /**
   * The request body applicable for this operation. The requestBody is fully supported in HTTP methods where the
   * HTTP 1.1 specification [RFC7231] has explicitly defined semantics for request bodies. In other cases where the
   * HTTP spec is vague (such as GET, HEAD and DELETE), requestBody is permitted but does not have well-defined
   * semantics and SHOULD be avoided if possible.
   */
  requestBody: requestBodySchema.optional(),
  /**
   * Request parameters
   */
  parameters: oasParameterSchema.array(),
  /**
   * External documentation object
   */
  externalDocs: oasExternalDocumentationSchema.optional(),
  deprecated: z.boolean().optional(),
  /** Response formats */
  responses: z.record(z.string(), z.any()).optional(),
}) satisfies ZodSchema<OpenAPIV3_1.OperationObject>

/**
 * Extended properties added to the spec definition for client usage
 *
 * WARNING: DO NOT ADD PROPERTIES THAT SHARE A NAME WITH OAS OPERATION ENTITIES
 *
 * This object is directly converted to a spec operation during saving
 */
const extendedRequestSchema = z.object({
  type: z.literal('request').optional().default('request'),
  uid: nanoidSchema,
  /** Path Key */
  path: z.string(),
  /** Request Method */
  method: z.enum(requestMethods),
  /** List of server UIDs specific to the request */
  servers: nanoidSchema.array().default([]),
  /** List of example UIDs associated with the request */
  examples: nanoidSchema.array().default([]),
  /** List of security scheme UIDs associated with the request */
  security: nanoidSchema.array().default([]),
})

/** Unified request schema for client usage */
export const requestSchema = oasRequestSchema.merge(extendedRequestSchema)
export type Request = z.infer<typeof requestSchema>
