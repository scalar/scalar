/**
 * Helpers for turning string-encoded request parameters back into the structured values that JSON
 * Schema validation expects, following the OpenAPI `style`/`explode` serialization rules.
 *
 * @see https://spec.openapis.org/oas/v3.1.1.html#style-values
 */

/** OpenAPI parameter location, which determines the default serialization style. */
export type ParameterLocation = 'path' | 'query' | 'header' | 'cookie'

/** Default serialization style per parameter location. */
const DEFAULT_STYLE: Record<ParameterLocation, string> = {
  query: 'form',
  cookie: 'form',
  path: 'simple',
  header: 'simple',
}

/**
 * Resolve the effective `style` and `explode` for a parameter, applying the OpenAPI defaults.
 *
 * `explode` defaults to `true` only for the `form` style and `false` for every other style, so the
 * default depends on the resolved style rather than the location alone.
 */
export const resolveSerialization = (
  location: ParameterLocation,
  style?: string,
  explode?: boolean,
): { style: string; explode: boolean } => {
  const resolvedStyle = style ?? DEFAULT_STYLE[location]
  return { style: resolvedStyle, explode: explode ?? resolvedStyle === 'form' }
}

/** Whether a resolved schema describes an array, including the OpenAPI 3.1 `type: ['array', 'null']` form. */
export const isArraySchema = (schema: Record<string, unknown> | undefined): boolean => {
  if (!schema) {
    return false
  }

  const type = schema.type
  return type === 'array' || (Array.isArray(type) && type.includes('array')) || 'items' in schema
}

/** Whether a resolved schema describes an object, including the OpenAPI 3.1 `type: ['object', 'null']` form. */
export const isObjectSchema = (schema: Record<string, unknown> | undefined): boolean => {
  if (!schema) {
    return false
  }

  const type = schema.type
  return type === 'object' || (Array.isArray(type) && type.includes('object')) || 'properties' in schema
}

const wrap = (value: string | undefined): string[] | undefined => (value === undefined ? undefined : [value])

const split = (value: string | undefined, delimiter: string): string[] | undefined =>
  value === undefined ? undefined : value.split(delimiter)

/**
 * Deserialize a string-encoded array parameter into its elements.
 *
 * Returns `undefined` when the parameter is absent so the caller can enforce `required` separately.
 * Object parameters (`deepObject`, simple/form objects) are not handled yet and are validated as-is.
 */
export const deserializeArrayParameter = ({
  style,
  explode,
  single,
  multi,
}: {
  style: string
  explode: boolean
  /** The single, joined value (for example `1,2,3`) as read from path, query, header, or cookie */
  single: string | undefined
  /** Every repeated value (query only, for example `?id=1&id=2` becomes `['1', '2']`) */
  multi?: string[] | undefined
}): string[] | undefined => {
  switch (style) {
    case 'spaceDelimited':
      return explode ? (multi ?? wrap(single)) : split(single, ' ')
    case 'pipeDelimited':
      return explode ? (multi ?? wrap(single)) : split(single, '|')
    case 'simple':
      // Path and header arrays are always comma-separated; `explode` does not change the delimiter.
      return split(single, ',')
    default:
      // `form` (and any unrecognised style): an exploded array repeats the key, otherwise it is comma-joined.
      return explode ? (multi ?? wrap(single)) : split(single, ',')
  }
}

/** Parse `R,100,G,200` (a flat list alternating key, value) into an object. */
const parseAlternating = (value: string | undefined, delimiter: string): Record<string, string> | undefined => {
  if (value === undefined) {
    return undefined
  }

  const parts = value.split(delimiter)
  const result: Record<string, string> = {}
  // Walk in pairs; a trailing key without a value is ignored.
  for (let index = 0; index + 1 < parts.length; index += 2) {
    const key = parts[index]
    const propertyValue = parts[index + 1]
    if (key !== undefined && propertyValue !== undefined) {
      result[key] = propertyValue
    }
  }
  return result
}

/** Parse `R=100,G=200` (delimiter-separated `key=value` pairs) into an object. */
const parsePairs = (value: string | undefined, delimiter: string): Record<string, string> | undefined => {
  if (value === undefined) {
    return undefined
  }

  const result: Record<string, string> = {}
  for (const pair of value.split(delimiter)) {
    const equals = pair.indexOf('=')
    if (equals !== -1) {
      result[pair.slice(0, equals)] = pair.slice(equals + 1)
    }
  }
  return result
}

/** Parse `name[R]=100&name[G]=200` from the query map into an object. */
const parseDeepObject = (query: Record<string, string>, name: string): Record<string, string> | undefined => {
  const prefix = `${name}[`
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith(prefix) && key.endsWith(']')) {
      result[key.slice(prefix.length, -1)] = value
    }
  }
  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Deserialize a string-encoded object parameter into its properties, following the OpenAPI
 * `style`/`explode` rules. Property values stay as strings so the caller can coerce them against the
 * object's property schemas.
 *
 * Returns `undefined` when the parameter is absent so the caller can enforce `required` separately.
 * Unsupported encodings (for example exploded `form` objects with no declared properties) also return
 * `undefined` and are left unvalidated rather than rejected.
 */
export const deserializeObjectParameter = ({
  style,
  explode,
  single,
  query,
  name,
  propertyNames,
}: {
  style: string
  explode: boolean
  /** The single value (for example `R,100,G,200`) as read from path, query, header, or cookie */
  single: string | undefined
  /** The full query map, needed for `deepObject` and exploded `form` objects (query only) */
  query?: Record<string, string> | undefined
  name: string
  /** Declared object property names, used to gather exploded `form` objects from the query map */
  propertyNames?: string[] | undefined
}): Record<string, string> | undefined => {
  // `deepObject`: properties are encoded as bracketed query keys, e.g. `color[R]=100`.
  if (style === 'deepObject') {
    return query ? parseDeepObject(query, name) : undefined
  }

  // Exploded `form`: each property is its own top-level query key, e.g. `R=100&G=200`.
  if (style === 'form' && explode) {
    if (!query || !propertyNames?.length) {
      return undefined
    }

    const result: Record<string, string> = {}
    for (const property of propertyNames) {
      const value = query[property]
      if (value !== undefined) {
        result[property] = value
      }
    }
    return Object.keys(result).length > 0 ? result : undefined
  }

  // Exploded `simple` (path/header): comma-separated `key=value` pairs, e.g. `R=100,G=200`.
  if (style === 'simple' && explode) {
    return parsePairs(single, ',')
  }

  // Non-exploded `form` and `simple`: a flat list alternating key, value, e.g. `R,100,G,200`.
  return parseAlternating(single, ',')
}
