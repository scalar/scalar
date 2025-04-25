import { selectedSecuritySchemeUidSchema } from '@/entities/shared/utility'
import { type ENTITY_BRANDS, nanoidSchema } from '@scalar/types/utils'
import { type ZodSchema, z } from 'zod'

import { XCodeSamplesSchema } from '@scalar/openapi-types/schemas/extensions'
import { XScalarStability } from '@scalar/types'
import { oasSecurityRequirementSchema } from '@scalar/types/entities'
import { oasParameterSchema } from './parameters'
import { type RequestExample, xScalarExampleSchema } from './request-examples'
import { oasExternalDocumentationSchema } from './spec-objects'

export const requestMethods = ['connect', 'delete', 'get', 'head', 'options', 'patch', 'post', 'put', 'trace'] as const

export type RequestMethod = (typeof requestMethods)[number]

/** A single set of populated values for a sent request */
export type ResponseInstance = Omit<Response, 'headers'> & {
  /** Store headers as an object to match what we had with axios */
  headers: Record<string, string>
  /** Keys of headers which set cookies */
  cookieHeaderKeys: string[]
  /** Time in ms the request took */
  duration: number
  /** The response status */
  status: number
  /** The response status text */
  statusText: string
  /** The response method */
  method: RequestMethod
  /** The request path */
  path: string
} & (
    | {
        /** The response data */
        data: string | Blob
        /** The response size in bytes */
        size: number
      }
    | {
        /** A stream reader for a streamable response body */
        reader: ReadableStreamDefaultReader<Uint8Array>
      }
  )

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
   *
   * These tags are the openapi spec tag names, not uids
   */
  'tags': z.string().array().optional(),
  /** A short summary of what the operation does. */
  'summary': z.string().optional(),
  /** A verbose explanation of the operation behavior. CommonMark syntax MAY be used for rich text representation. */
  'description': z.string().optional(),
  /**
   * Unique string used to identify the operation. The id MUST be unique among all operations described in the API.
   * The operationId value is case-sensitive. Tools and libraries MAY use the operationId to uniquely identify an
   * operation, therefore, it is RECOMMENDED to follow bin common programming naming conventions./
   */
  'operationId': z.string().optional(),
  /**
   * A declaration of which security mechanisms can be used across the API. The list of
   * values includes alternative security requirement objects that can be used. Only
   * one of the security requirement objects need to be satisfied to authorize a request.
   * Individual operations can override this definition. To make security optional, an empty
   * security requirement ({}) can be included in the array.
   */
  'security': z.array(oasSecurityRequirementSchema).optional(),
  /**
   * The request body applicable for this operation. The requestBody is fully supported in HTTP methods where the
   * HTTP 1.1 specification [RFC7231] has explicitly defined semantics for request bodies. In other cases where the
   * HTTP spec is vague (such as GET, HEAD and DELETE), requestBody is permitted but does not have well-defined
   * semantics and SHOULD be avoided if possible.
   */
  'requestBody': requestBodySchema.optional(),
  /**
   * Request parameters
   */
  'parameters': oasParameterSchema.array().optional(),
  /**
   * External documentation object
   */
  'externalDocs': oasExternalDocumentationSchema.optional(),
  'deprecated': z.boolean().optional(),
  /** Response formats */
  'responses': z.record(z.string(), z.any()).optional(),
  /** xScalar examples */
  'x-scalar-examples': z.record(z.string(), xScalarExampleSchema).optional(),
  /** Hide operations */
  'x-internal': z.boolean().optional(),
  /** Ignore operations */
  'x-scalar-ignore': z.boolean().optional(),
  /** Post response scripts */
  'x-post-response': z.string().optional(),
})

/**
 * An OpenAPI extension to indicate the stability of the operation
 *
 * @example
 * ```yaml
 * x-scalar-stability: deprecated
 * ```
 */
const ScalarStabilitySchema = z.object({
  'x-scalar-stability': z
    .enum([XScalarStability.Deprecated, XScalarStability.Experimental, XScalarStability.Stable])
    .optional()
    .catch(undefined),
})

/**
 * Extended properties added to the spec definition for client usage
 *
 * WARNING: DO NOT ADD PROPERTIES THAT SHARE A NAME WITH OAS OPERATION ENTITIES
 *
 * This object is directly converted to a spec operation during saving
 */
const extendedRequestSchema = z.object({
  type: z.literal('request').optional().default('request'),
  uid: nanoidSchema.brand<ENTITY_BRANDS['OPERATION']>(),
  /** Path Key */
  path: z.string().optional().default(''),
  /** Request Method */
  method: z.enum(requestMethods).default('get'),
  /** List of server UIDs specific to the request */
  servers: z.string().brand<ENTITY_BRANDS['SERVER']>().array().default([]),
  /** The currently selected server */
  selectedServerUid: z.string().brand<ENTITY_BRANDS['SERVER']>().optional().nullable().default(null),
  /** List of example UIDs associated with the request */
  examples: z.string().brand<ENTITY_BRANDS['EXAMPLE']>().array().default([]),
  /** List of security scheme UIDs associated with the request */
  selectedSecuritySchemeUids: selectedSecuritySchemeUidSchema,
})

/** The code to execute */
export const PostResponseSchema = z.string()

/**
 * Post response scripts allow to execute arbitrary code after a response is received
 *
 * This is useful for:
 * - Extracting data from the response, or
 * - Testing the response
 *
 * @example
 * ```yaml
 * x-post-response: |
 *   pm.test("Status code is 200", () => {
 *     pm.response.to.have.status(200)
 *   })
 * ```
 */
export const xPostResponseSchema = z.object({
  'x-post-response': PostResponseSchema.optional(),
})

export type PostResponseScript = z.infer<typeof PostResponseSchema>
export type PostResponseScripts = z.infer<typeof xPostResponseSchema>['x-post-response']

/** Unified request schema for client usage */
export const requestSchema = oasRequestSchema
  .omit({ 'x-scalar-examples': true })
  .merge(XCodeSamplesSchema)
  .merge(ScalarStabilitySchema)
  .merge(extendedRequestSchema)
  .merge(xPostResponseSchema)

export type Request = z.infer<typeof requestSchema>
export type RequestPayload = z.input<typeof requestSchema>
