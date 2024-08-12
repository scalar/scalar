import { type ZodSchema, type ZodTypeDef, z } from 'zod'

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
  const result = schema.safeParse(data)

  if (!result.success) {
    console.error('Zod Schema Error')
    console.group()
    result.error.issues.forEach((issue) => {
      console.log(`Path: ${issue.path.join(', ')} \nError: ${issue.message}`)
    })

    console.groupEnd()
  }

  if (throwError && !result.success) throw new Error('Zod validation failure')

  return result.success ? result.data : null
}

export const emailSchema = z
  .string()
  .email()
  .transform((a) => a.toLowerCase())

export const timestampSchema = z.number().int().min(0)
export const nanoidSchema = z.string().min(5)

/** Unix timestamp in seconds. Default to current time */
export function unixTimestamp(
  /** Javascript date or timestamp in milliseconds */
  date: Date | number | string = Date.now(),
) {
  return Math.floor(new Date(date).getTime() / 1000)
}

export enum Environments {
  Dev = 'development',
  Test = 'test',
  Prod = 'production',
  Staging = 'staging',
}

export type DeployEnvironments =
  | 'development'
  | 'test'
  | 'staging'
  | 'production'

export const deployEnvironmentsSchema = z
  .nativeEnum(Environments)
  .optional()
  .default(Environments.Dev)
