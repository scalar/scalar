import { z } from 'zod'

/**
 * Type of a schema that makes fields optional while removing defaults and preserving catch
 */
type ZodDeepPartial<T extends z.ZodTypeAny> = T extends z.ZodObject<infer Shape>
  ? z.ZodObject<{ [K in keyof Shape]: z.ZodOptional<ZodDeepPartial<Shape[K]>> }>
  : T extends z.ZodArray<infer U>
    ? z.ZodArray<ZodDeepPartial<U>>
    : T extends z.ZodRecord<infer K, infer V>
      ? z.ZodRecord<K, ZodDeepPartial<V>>
      : T extends z.ZodUnion<infer U>
        ? z.ZodUnion<[ZodDeepPartial<U[number]>]>
        : T extends z.ZodOptional<infer U>
          ? z.ZodOptional<ZodDeepPartial<U>>
          : T

/**
 * A custom implementation of zodDeepPartial which removes defaults while preserving catch
 * This is temporary while the zod .deepPartial is deprecated, once Colin brings back a new one we can use that instead
 */
export const zodDeepPartial = <T extends z.ZodTypeAny>(schema: T): ZodDeepPartial<T> => {
  // Remove any default values from the schema
  const removeDefaults = (s: z.ZodTypeAny): z.ZodTypeAny => {
    if (s instanceof z.ZodDefault) {
      return removeDefaults(s.removeDefault())
    }
    return s
  }

  const processSchema = (_schema: z.ZodTypeAny): z.ZodTypeAny => {
    // First remove any default values
    const schema = removeDefaults(_schema)

    if (schema instanceof z.ZodObject) {
      const newShape = {} as z.ZodRawShape
      for (const [key, value] of Object.entries(schema.shape)) {
        // Add type assertion to ensure value is ZodTypeAny
        newShape[key] = zodDeepPartial(value as z.ZodTypeAny).optional()
      }
      return z.object(newShape)
    }

    if (schema instanceof z.ZodArray) {
      return z.array(zodDeepPartial(schema.element))
    }

    if (schema instanceof z.ZodRecord) {
      return z.record(schema.keySchema, zodDeepPartial(schema.valueSchema))
    }

    if (schema instanceof z.ZodUnion) {
      // Add explicit type for option parameter
      return z.union(schema.options.map((option: z.ZodTypeAny) => zodDeepPartial(option)))
    }

    if (schema instanceof z.ZodOptional) {
      return z.optional(zodDeepPartial(schema.unwrap()))
    }

    return schema
  }

  return processSchema(schema) as ZodDeepPartial<T>
}
