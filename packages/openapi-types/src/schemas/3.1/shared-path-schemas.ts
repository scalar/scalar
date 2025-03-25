import { z } from 'zod'
import { ExternalDocumentationObjectSchema } from './external-documentation-object'
import { ParameterObjectSchema } from './parameter-object'
import { RequestBodyObjectSchema } from './request-body-object'
import { ResponseObjectSchema } from './response-object'
import { SecurityRequirementObjectSchema } from './security-requirement-object'
import { ServerObjectSchema } from './server-object'

/**
 * Base Operation Object Schema
 * This helps break circular dependencies between operation-object and callback-object
 */
export const BaseOperationObjectSchema = z.object({
  tags: z.string().array().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  externalDocs: ExternalDocumentationObjectSchema.optional(),
  operationId: z.string().optional(),
  parameters: ParameterObjectSchema.array().optional(),
  requestBody: RequestBodyObjectSchema.optional(),
  responses: z.record(z.string(), ResponseObjectSchema).optional(),
  security: z.array(SecurityRequirementObjectSchema).optional(),
  deprecated: z.boolean().optional(),
})

/**
 * Base Path Item Object Schema
 * This helps break circular dependencies between path-item-object and callback-object
 */
export const BasePathItemObjectSchema = z.object({
  $ref: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  servers: z.array(ServerObjectSchema).optional(),
  parameters: z.array(ParameterObjectSchema).optional(),
})
