import { isObject } from './helpers/is-object'
import type { Schema } from './schema'

/**
 * Validates that a given value matches the specified schema.
 *
 * The schema describes the expected structure/type of data.
 * Supported schema types include:
 * - 'any':         Accepts any value.
 * - 'unknown':     Accepts any value (generates `unknown` instead of `any` in types).
 * - 'number':      Only numbers are valid.
 * - 'string':      Only strings are valid.
 * - 'boolean':     Only booleans are valid.
 * - 'nullable':    Only `null` is valid.
 * - 'notDefined':  Only `undefined` is valid.
 * - 'array':       Array with all items validated recursively.
 * - 'record':      Object with string/number keys and values, checked recursively.
 * - 'object':      Plain object with fixed property keys, each validated recursively.
 * - 'union':       Accepts if value matches any of the listed schemas.
 * - 'optional':    Accepts `undefined` or a value matching the inner schema.
 * - 'intersection': Accepts if value matches every member schema (members are object schemas; value must be a plain object).
 * - 'literal':     Exact match with a literal value.
 * - 'lazy':        Delegates to the schema returned by the factory.
 * - 'evaluate':    Transforms value then validates against an inner schema.
 *
 * @example
 * ```ts
 * import { number, object, string, validate } from '@scalar/validation'
 *
 * const schema = object({ id: number(), name: string() })
 * validate(schema, { id: 1, name: 'Ada' }) // true
 * validate(schema, { id: 1, name: 2 }) // false
 * ```
 *
 * If schema is `undefined`, validation fails.
 * Returns true if the value matches the schema, false otherwise.
 */
export const validate = (schema: Schema | undefined, value: unknown): boolean => {
  if (!schema) {
    return false
  }
  if (schema.type === 'any' || schema.type === 'unknown') {
    return true
  }
  if (schema.type === 'number') {
    return typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value)
  }
  if (schema.type === 'string') {
    return typeof value === 'string'
  }
  if (schema.type === 'boolean') {
    return typeof value === 'boolean'
  }
  if (schema.type === 'nullable') {
    return value === null
  }
  if (schema.type === 'notDefined') {
    return value === undefined
  }
  if (schema.type === 'array') {
    return Array.isArray(value) && value.every((item) => validate(schema.items, item))
  }
  if (schema.type === 'record') {
    if (!isObject(value)) {
      return false
    }

    const keys = Object.keys(value)
    return keys.every((key) => validate(schema.key, key) && validate(schema.value, value[key]))
  }
  if (schema.type === 'object') {
    if (!isObject(value)) {
      return false
    }
    const schemaKeys = Object.keys(schema.properties)
    return schemaKeys.every((key) => validate(schema.properties[key], value[key]))
  }
  if (schema.type === 'optional') {
    return value === undefined || validate(schema.schema, value)
  }
  if (schema.type === 'union') {
    return schema.schemas.some((schema) => validate(schema, value))
  }
  if (schema.type === 'intersection') {
    if (schema.schemas.length === 0) {
      // Vacuous: no constraints (matches `Array.prototype.every` on an empty list).
      return true
    }
    if (!isObject(value)) {
      return false
    }
    return schema.schemas.every((subSchema) => validate(subSchema, value))
  }
  if (schema.type === 'literal') {
    return value === schema.value
  }
  if (schema.type === 'lazy') {
    return validate(schema.schema(), value)
  }
  if (schema.type === 'evaluate') {
    return validate(schema.schema, schema.expression(value))
  }
  // We need to assert here that schema has the type never so we know we handle all cases
  const _exhaustive: never = schema
  console.warn('Unknown schema type:', _exhaustive)
  return false
}
