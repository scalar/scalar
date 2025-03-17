import { z } from 'zod'

/**
 * Type of a schema that removes defaults and catches from the fields recursively
 *
 * TODO check this out https://github.com/colinhacks/zod/discussions/845
 * */
type CleanSchema<T extends z.ZodTypeAny> = T extends z.ZodObject<infer Shape>
  ? z.ZodObject<{ [K in keyof Shape]: z.ZodOptional<CleanSchema<Shape[K]>> }>
  : T extends z.ZodDefault<infer U>
    ? CleanSchema<U>
    : T extends z.ZodCatch<infer U>
      ? CleanSchema<U>
      : T extends z.ZodArray<infer U>
        ? z.ZodArray<CleanSchema<U>>
        : T extends z.ZodRecord<infer K, infer V>
          ? z.ZodRecord<K, CleanSchema<V>>
          : T extends z.ZodUnion<infer U>
            ? z.ZodUnion<U>
            : T extends z.ZodOptional<infer U>
              ? z.ZodOptional<CleanSchema<U>>
              : T

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
  if (schema instanceof z.ZodArray) {
    const cleanedElement = cleanSchema(schema.element)
    const cleanedArray = z.array(cleanedElement._def.innerType)
    return cleanedArray.optional() as z.ZodOptional<CleanSchema<T>>
  }
  if (schema instanceof z.ZodRecord) {
    const cleanedValue = cleanSchema(schema.valueSchema)
    const cleanedRecord = z.record(schema.keySchema, cleanedValue._def.innerType)
    return cleanedRecord.optional() as z.ZodOptional<CleanSchema<T>>
  }
  if (schema instanceof z.ZodUnion) {
    const cleanedOptions = schema.options.map((option: z.ZodTypeAny) => cleanSchema(option)._def.innerType)
    const cleanedUnion = z.union(cleanedOptions)
    return cleanedUnion.optional() as z.ZodOptional<CleanSchema<T>>
  }
  if (schema instanceof z.ZodOptional) {
    const cleanedInner = cleanSchema(schema._def.innerType)
    return cleanedInner
  }
  return schema.optional() as z.ZodOptional<CleanSchema<T>>
}
