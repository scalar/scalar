import { parse, stringify } from 'yaml'

import { type AnyObject } from './types'

type PrimitiveOrObject = object | string | null | number | boolean | undefined

/** Yaml handling with optional safeparse */
export const yaml = {
  /** Parse and throw if the return value is not an object */
  parse: (val: string) => {
    const yamlObject = parse(val)
    if (typeof yamlObject !== 'object') throw Error('Invalid YAML object')
    return yamlObject as AnyObject
  },
  /** Parse and return a fallback on failure */
  parseSafe<T extends PrimitiveOrObject>(
    val: string,
    fallback: T | ((err: any) => T),
  ): AnyObject | T {
    try {
      return yaml.parse(val)
    } catch (err: any) {
      return typeof fallback === 'function' ? fallback(err) : fallback
    }
  },
  stringify,
}

/** JSON handling with optional safeparse */
export const json = {
  /** Parse and throw if the return value is not an object */
  parse: (val: string): AnyObject => {
    const jsonObject = JSON.parse(val)
    if (typeof jsonObject !== 'object') throw Error('Invalid JSON object')
    return jsonObject
  },
  /** Parse and return a fallback on failure */
  parseSafe<T extends PrimitiveOrObject>(
    val: string,
    fallback: T | ((err: any) => T),
  ): AnyObject | T {
    try {
      return json.parse(val)
    } catch (err) {
      return typeof fallback === 'function' ? fallback(err) : fallback
    }
  },
  stringify: (val: object) => JSON.stringify(val),
}

/**
 * Check if value is a valid JSON string
 */
export const isJsonString = (value?: any) => {
  if (typeof value !== 'string') return false

  return !!json.parseSafe(value, false)
}

/**
 * This helper is used to transform the content of the swagger file to JSON, even it was YAML.
 */
export const transformToJson = (value: string) => {
  // Try json, then fallback to yaml, then fallback to string
  return JSON.stringify(json.parseSafe(value, yaml.parseSafe(value, value)))
}

/** Validates a JSON string if provided. Otherwise returns the raw Yaml */
export function formatJsonOrYamlString(value: string) {
  // If we don't start with a bracket assume yaml
  const trimmed = value.trim()
  if (trimmed[0] !== '{') return value

  try {
    // JSON
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    // Yaml
    return value
  }
}

/** Parse JSON or YAML into an object */
export const parseJsonOrYaml = (value: string | AnyObject): AnyObject => {
  if (typeof value !== 'string') return value

  const jsonObject = json.parseSafe(value, null)
  if (jsonObject) return jsonObject

  // Value is probably supposed to be JSON. Throw
  if (value.length > 0 && ['{', '['].includes(value[0])) {
    throw Error('Invalid JSON or YAML')
  }

  return yaml.parseSafe(value, (err) => {
    throw Error(err)
  })
}
