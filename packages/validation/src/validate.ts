import { isObject } from './helpers/is-object'
import type { Schema } from './schema'

/**
 * Internal validation implementation. Threads a `cache` of visited
 * `(object, schema)` pairs through every recursive call so cyclic graphs
 * terminate instead of recursing forever. If the same value has already been
 * entered for the same schema in this run, we assume it is valid: the value
 * is being checked higher up the call stack and any concrete mismatch would
 * surface there rather than via re-entry on the cycle.
 */
const validateInner = (schema: Schema | undefined, value: unknown, cache: WeakMap<object, Set<Schema>>): boolean => {
  if (!schema) {
    return false
  }

  // Short-circuit on cycles: the same value is already being validated against this schema.
  if (isObject(value) && cache.get(value)?.has(schema)) {
    return true
  }
  // Track visited schemas to prevent infinite recursion on cyclic graphs.
  if (isObject(value)) {
    const schemas = cache.get(value) || new Set<Schema>()
    schemas.add(schema)
    cache.set(value, schemas)
  }

  if (schema.type === 'any' || schema.type === 'unknown') {
    return true
  }
  if (schema.type === 'function') {
    return typeof value === 'function'
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
    return Array.isArray(value) && value.every((item) => validateInner(schema.items, item, cache))
  }
  if (schema.type === 'record') {
    if (!isObject(value)) {
      return false
    }

    const keys = Object.keys(value)
    return keys.every((key) => validateInner(schema.key, key, cache) && validateInner(schema.value, value[key], cache))
  }
  if (schema.type === 'object') {
    if (!isObject(value)) {
      return false
    }
    const schemaKeys = Object.keys(schema.properties)
    return schemaKeys.every((key) => validateInner(schema.properties[key], value[key], cache))
  }
  if (schema.type === 'optional') {
    return value === undefined || validateInner(schema.schema, value, cache)
  }
  if (schema.type === 'union') {
    return schema.schemas.some((branch) => validateInner(branch, value, cache))
  }
  if (schema.type === 'intersection') {
    if (schema.schemas.length === 0) {
      // Vacuous: no constraints (matches `Array.prototype.every` on an empty list).
      return true
    }
    if (!isObject(value)) {
      return false
    }
    return schema.schemas.every((subSchema) => validateInner(subSchema, value, cache))
  }
  if (schema.type === 'literal') {
    return value === schema.value
  }
  if (schema.type === 'lazy') {
    return validateInner(schema.schema(), value, cache)
  }
  if (schema.type === 'evaluate') {
    return validateInner(schema.schema, schema.expression(value), cache)
  }
  // We need to assert here that schema has the type never so we know we handle all cases
  const _exhaustive: never = schema
  console.warn('Unknown schema type:', _exhaustive)
  return false
}

/**
 * Validates that a given value matches the specified schema.
 *
 * The schema describes the expected structure/type of data.
 * Supported schema types include:
 * - 'any':         Accepts any value.
 * - 'unknown':     Accepts any value (generates `unknown` instead of `any` in types).
 * - 'function':    Only functions are valid (signature is not checked at runtime).
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
 * The optional `cache` argument tracks visited object–schema pairs to stop
 * infinite recursion on cyclic value graphs (for example a node whose child
 * points back at itself paired with a `lazy` schema). Callers normally omit it.
 *
 * If schema is `undefined`, validation fails.
 * Returns true if the value matches the schema, false otherwise.
 */
export const validate = (
  schema: Schema | undefined,
  value: unknown,
  cache: WeakMap<object, Set<Schema>> = new WeakMap(),
): boolean => validateInner(schema, value, cache)
