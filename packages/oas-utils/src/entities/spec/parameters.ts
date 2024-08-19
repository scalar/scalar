import type { OpenAPI } from '@scalar/openapi-types'
import { type ZodSchema, z } from 'zod'

export const parameterTypeSchema = z.enum(['path', 'query', 'header', 'cookie'])
export type ParamType = z.infer<typeof parameterTypeSchema>

export const parameterStyleSchema = z.enum([
  'matrix',
  'simple',
  'form',
  'label',
  'spaceDelimited',
  'pipeDelimited',
  'deepObject',
])
export type ParameterStyle = z.infer<typeof parameterStyleSchema>

/**
 * OpenAPI compliant parameters object
 */
export const oasParameterSchema = z.object({
  in: parameterTypeSchema,
  name: z.string(),
  description: z.string().optional(),
  /** Defaulted to false */
  required: z.boolean().optional(),
  /** Defaulted to false */
  deprecated: z.boolean().optional().default(false),
  schema: z.unknown().optional(),
  content: z.unknown().optional(),
  /** Defaulted according to @url https://spec.openapis.org/oas/v3.1.0#parameter-object */
  style: parameterStyleSchema.optional(),
}) satisfies ZodSchema<OpenAPI.Parameter>

export type RequestParameter = z.infer<typeof oasParameterSchema>
