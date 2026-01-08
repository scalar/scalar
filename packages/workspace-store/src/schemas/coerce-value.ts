import type { TSchema } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'

/**
 * Coerces a value to match the provided TypeBox schema by first converting and then casting the value.
 * This is useful for ensuring values match their expected types, especially when dealing with
 * form inputs or API responses that may need type conversion.
 *
 * @param schema - The TypeBox schema to coerce the value against
 * @param value - The value to coerce
 * @returns The coerced value that matches the schema
 *
 * @example
 * // Convert string "123" to number
 * const schema = Type.Number()
 * const value = "123"
 * const coerced = coerceValue<number>(schema, value) // Returns 123
 *
 * @example
 * // Convert string "true" to boolean with explicit type
 * const schema = Type.Boolean()
 * const value = "true"
 * const coerced = coerceValue<boolean>(schema, value) // Returns true
 *
 * @example
 * // Use with complex types
 * const schema = xScalarEnvironmentSchema
 * const value = { name: 'prod' }
 * const coerced = coerceValue<XScalarEnvironment>(schema, value)
 */
export const coerceValue = <TResult = unknown>(schema: TSchema, value: unknown): TResult =>
  Value.Cast(schema, value) as TResult
