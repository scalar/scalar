import type { TSchema } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

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
 * const coerced = coerceValue(schema, value) // Returns 123
 *
 * @example
 * // Convert string "true" to boolean
 * const schema = Type.Boolean()
 * const value = "true"
 * const coerced = coerceValue(schema, value) // Returns true
 */
export const coerceValue = <T extends TSchema>(schema: T, value: unknown) => {
  return Value.Cast(schema, Value.Convert(schema, value))
}
