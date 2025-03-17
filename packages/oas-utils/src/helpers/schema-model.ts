import type { ZodSchema, ZodTypeDef } from 'zod'

/** Parse an value from a given schema with optional error or null return */
export function schemaModel<T, I = any>(
  data: I,
  schema: ZodSchema<T, ZodTypeDef, any>,
  throwError?: true,
  errorLocation?: string,
): T
export function schemaModel<T, I = any>(
  data: I,
  schema: ZodSchema<T, ZodTypeDef, any>,
  throwError?: false,
  errorLocation?: string,
): T | null
/** Parse a Zod */
export function schemaModel<T, I = any>(
  data: I,
  schema: ZodSchema<T, ZodTypeDef, any>,
  throwError = true,
  errorLocation?: string,
) {
  const result = schema.safeParse(data)

  if (!result.success) {
    console.group('Schema Error' + (errorLocation ? ` - ${errorLocation}` : ''))
    console.warn(JSON.stringify(result.error.format(), null, 2))
    console.log('Received: ', data)
    console.groupEnd()
  }

  if (throwError && !result.success) {
    throw new Error('Zod validation failure')
  }

  return result.data
}
