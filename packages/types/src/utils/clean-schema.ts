import { z } from 'zod'

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

export const cleanSchema = <T extends z.ZodTypeAny>(schema: T): z.ZodOptional<CleanSchema<T>> => {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape
    const newShape = Object.fromEntries(
      Object.entries(shape).map(([key, field]) => [key, cleanSchema(field as z.ZodTypeAny)]),
    )
    return z.object(newShape).optional() as z.ZodOptional<CleanSchema<T>>
  }
  if (schema instanceof z.ZodDefault) {
    return cleanSchema(schema._def.innerType)
  }
  if (schema instanceof z.ZodCatch) {
    return cleanSchema(schema._def.innerType)
  }
  return schema.optional() as z.ZodOptional<CleanSchema<T>>
}
