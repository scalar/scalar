import { isObject } from './helpers/is-object'
import type { Schema } from './schema'

export const validate = (schema: Schema | undefined, value: unknown): boolean => {
  if (!schema) {
    return false
  }
  if (schema.type === 'any') {
    return true
  }
  if (schema.type === 'number') {
    return typeof value === 'number'
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
  if (schema.type === 'union') {
    return schema.schemas.some((schema) => validate(schema, value))
  }
  if (schema.type === 'literal') {
    return value === schema.value
  }
  if (schema.type === 'recursive') {
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
