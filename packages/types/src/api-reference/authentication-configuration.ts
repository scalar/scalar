import { z } from 'zod'
import { securitySchemeSchema } from '@scalar/types/entities'

/** Type of a schema that removes defaults and catches from the fields recursively */
type CleanSchema<T extends z.ZodTypeAny> = T extends z.ZodObject<infer Shape>
  ? z.ZodObject<{ [K in keyof Shape]: z.ZodOptional<CleanSchema<Shape[K]>> }>
  : T extends z.ZodDefault<infer U>
    ? CleanSchema<U>
    : T extends z.ZodCatch<infer U>
      ? CleanSchema<U>
      : T

/**
 * Helper function to recursively process schema fields and remove defaults and catches while setting field to optional
 */

export const makeOptionalAndClean = <T extends z.ZodTypeAny>(schema: T): z.ZodOptional<CleanSchema<T>> => {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape
    const newShape = Object.fromEntries(
      Object.entries(shape).map(([key, field]) => [key, makeOptionalAndClean(field as z.ZodTypeAny)]),
    )
    return z.object(newShape).optional() as z.ZodOptional<CleanSchema<T>>
  }
  if (schema instanceof z.ZodDefault) {
    return makeOptionalAndClean(schema._def.innerType)
  }
  if (schema instanceof z.ZodCatch) {
    return makeOptionalAndClean(schema._def.innerType)
  }
  return schema.optional() as z.ZodOptional<CleanSchema<T>>
}
const _authenticationConfigurationSchema = makeOptionalAndClean(securitySchemeSchema)

/**
 * Authentication Configuration
 * This takes our securitySchemeSchema and makes each field optional
 * We will then override the schema with these values
 */
export const authenticationConfigurationSchema = z.record(z.string(), _authenticationConfigurationSchema)
export type AuthenticationConfiguration = z.infer<typeof authenticationConfigurationSchema>
