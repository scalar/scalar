import type { ZodSchema, ZodTypeDef } from 'zod'

/** Parse an value from a given schema with optional error or null return */
export function schemaModel<T, I = any>(
  data: I,
  schema: ZodSchema<T, ZodTypeDef, any>,
  throwError?: true,
): T
export function schemaModel<T, I = any>(
  data: I,
  schema: ZodSchema<T, ZodTypeDef, any>,
  throwError?: false,
): T | null
export function schemaModel<T, I = any>(
  data: I,
  schema: ZodSchema<T, ZodTypeDef, any>,
  throwError = true,
) {
  if (throwError) {
    const result = schema.safeParse(data)

    if (!result.success) {
      console.error('Zod Schema Error')
      console.group()
      result.error.issues.forEach((issue) => {
        console.log(`Path: ${issue.path.join(', ')} \nError: ${issue.message}`)
      })

      console.groupEnd()
      throw new Error('Zod validation failure')
    }

    return result.data
  } else {
    const res = schema.safeParse(data)
    return res.success ? res.data : null
  }
}
