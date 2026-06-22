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

/**
 * Whether any composed subschema satisfies the predicate, looking through `anyOf`/`oneOf`/`allOf`.
 *
 * Optional array/object parameters are commonly described as `anyOf: [{ type: 'array' }, { type: 'null' }]`
 * (for example FastAPI/Pydantic `Optional[List[str]]`). Without unwrapping these we would treat the value
 * as a plain string and skip style-aware deserialization. Mirrors `getStructuredType` in
 * `@scalar/workspace-store`'s `de-serialize-parameter`.
 */
const matchesComposedSchema = (
  schema: Record<string, unknown>,
  predicate: (schema: Record<string, unknown>) => boolean,
): boolean => {
  for (const keyword of ['anyOf', 'oneOf', 'allOf'] as const) {
    const subSchemas = schema[keyword]
    if (Array.isArray(subSchemas)) {
      for (const subSchema of subSchemas) {
        if (subSchema && typeof subSchema === 'object' && predicate(subSchema as Record<string, unknown>)) {
          return true
        }
      }
    }
  }
  return false
}

/** Whether a resolved schema describes an array, including the OpenAPI 3.1 `type: ['array', 'null']` form. */
export const isArraySchema = (schema: Record<string, unknown> | undefined): boolean => {
  if (!schema) {
    return false
  }

  const type = schema.type
  if (type === 'array' || (Array.isArray(type) && type.includes('array')) || 'items' in schema) {
    return true
  }
  return matchesComposedSchema(schema, isArraySchema)
}

/** Whether a resolved schema describes an object, including the OpenAPI 3.1 `type: ['object', 'null']` form. */
export const isObjectSchema = (schema: Record<string, unknown> | undefined): boolean => {
  if (!schema) {
    return false
  }

  const type = schema.type
  if (type === 'object' || (Array.isArray(type) && type.includes('object')) || 'properties' in schema) {
    return true
  }
  return matchesComposedSchema(schema, isObjectSchema)
}

/**
 * Collect the declared property names of an object schema, looking through `anyOf`/`oneOf`/`allOf`.
 *
 * `isObjectSchema` unwraps composed schemas (for example an optional object written as
 * `anyOf: [{ type: 'object', properties: {…} }, { type: 'null' }]`), so property extraction has to do the
 * same. Otherwise the names live on a subschema, the top level looks empty, and exploded `form` objects
 * fall back to free-form gathering — claiming unrelated keys and failing `additionalProperties: false`.
 */
export const getObjectPropertyNames = (schema: Record<string, unknown> | undefined): string[] => {
  if (!schema) {
    return []
  }

  const names = new Set<string>()

  const properties = schema.properties
  if (properties && typeof properties === 'object') {
    for (const key of Object.keys(properties)) {
      names.add(key)
    }
  }

  for (const keyword of ['anyOf', 'oneOf', 'allOf'] as const) {
    const subSchemas = schema[keyword]
    if (Array.isArray(subSchemas)) {
      for (const subSchema of subSchemas) {
        if (subSchema && typeof subSchema === 'object') {
          for (const name of getObjectPropertyNames(subSchema as Record<string, unknown>)) {
            names.add(name)
          }
        }
      }
    }
  }

  return [...names]
}

const wrap = (value: string | undefined): string[] | undefined => (value === undefined ? undefined : [value])

// An empty value is an empty list, not a one-element list of the empty string. Otherwise `?ids=`
// would satisfy a `minItems: 1` array while failing the element type check on `''`.
const split = (value: string | undefined, delimiter: string): string[] | undefined =>
  value === undefined ? undefined : value === '' ? [] : value.split(delimiter)

/**
 * Build an exploded array from the repeated values (query) or the single value (other locations).
 *
 * A lone empty value (`?ids=`) is an empty array, not `['']`, matching the non-exploded `split`
 * behaviour so an optional empty array is not rejected on its element type and `minItems` runs as
 * intended. An explicitly repeated empty (`?ids=a&ids=`) keeps every element.
 */
const explodedArray = (single: string | undefined, multi: string[] | undefined): string[] | undefined => {
  const values = multi ?? wrap(single)
  if (values === undefined) {
    return undefined
  }
  return values.length === 1 && values[0] === '' ? [] : values
}

/** Drop a leading prefix (for example the `.` of `label` or the `;` of `matrix`) when present. */
const stripPrefix = (value: string, prefix: string): string =>
  value.startsWith(prefix) ? value.slice(prefix.length) : value

/** Return the part of a `key=value` segment after the first `=`, or the whole segment when there is none. */
const valueAfterEquals = (segment: string): string => {
  const equals = segment.indexOf('=')
  return equals === -1 ? segment : segment.slice(equals + 1)
}

/** Split a `matrix`-encoded value into its `;`-separated segments, dropping the leading `;` and empties. */
const matrixSegments = (value: string): string[] =>
  stripPrefix(value, ';')
    .split(';')
    .filter((segment) => segment.length > 0)

/**
 * Split a `label`-encoded value into its parts, dropping the leading `.`. Per the OpenAPI serialization
 * rules a non-exploded `label` value is comma-separated (`.blue,black,brown`, `.R,100,G,200`) while an
 * exploded one is dot-separated (`.blue.black.brown`, `.R=100.G=200`). An empty value means no parts.
 */
const labelParts = (value: string, explode: boolean): string[] => {
  const inner = stripPrefix(value, '.')
  return inner === '' ? [] : inner.split(explode ? '.' : ',')
}

/** Build an object from a list of `key=value` segments (for example `['R=100', 'G=200']`). */
const pairsFromList = (parts: string[]): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const part of parts) {
    const equals = part.indexOf('=')
    if (equals !== -1) {
      result[part.slice(0, equals)] = part.slice(equals + 1)
    }
  }
  return result
}

/** Build an object from a flat list alternating key, value (for example `['R', '100', 'G', '200']`). */
const alternatingFromList = (parts: string[]): Record<string, string> => {
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

/**
 * Deserialize a `matrix`-style array (path only). Non-exploded values join the elements after a single
 * `;name=` prefix (`;ids=1,2,3`), while exploded values repeat the prefix per element (`;ids=1;ids=2`).
 */
const parseMatrixArray = (value: string | undefined, explode: boolean): string[] | undefined => {
  if (value === undefined) {
    return undefined
  }

  const segments = matrixSegments(value)

  if (explode) {
    return segments.map(valueAfterEquals)
  }

  // Non-exploded: a single `name=a,b,c` segment whose value is comma-separated.
  const [first] = segments
  return first === undefined ? [] : valueAfterEquals(first).split(',')
}

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
      return explode ? explodedArray(single, multi) : split(single, ' ')
    case 'pipeDelimited':
      return explode ? explodedArray(single, multi) : split(single, '|')
    case 'simple':
      // Path and header arrays are comma-separated; `explode` does not change the delimiter. HTTP allows
      // optional whitespace after the comma in header list values (`a, b, c`), so trim each element.
      return single === undefined ? undefined : single === '' ? [] : single.split(',').map((element) => element.trim())
    case 'label':
      // Path `label` arrays are dot-prefixed. Non-exploded values are comma-separated (`.1,2,3`),
      // exploded values are dot-separated (`.1.2.3`).
      return single === undefined ? undefined : labelParts(single, explode)
    case 'matrix':
      return parseMatrixArray(single, explode)
    default:
      // `form` (and any unrecognised style): an exploded array repeats the key, otherwise it is comma-joined.
      return explode ? explodedArray(single, multi) : split(single, ',')
  }
}

/** Parse `R,100,G,200` (a flat list alternating key, value) into an object. */
const parseAlternating = (value: string | undefined, delimiter: string): Record<string, string> | undefined =>
  value === undefined ? undefined : alternatingFromList(value.split(delimiter))

/** Parse `R=100,G=200` (delimiter-separated `key=value` pairs) into an object. */
const parsePairs = (value: string | undefined, delimiter: string): Record<string, string> | undefined =>
  value === undefined ? undefined : pairsFromList(value.split(delimiter))

/** Parse `name[R]=100&name[G]=200` from the query map into an object. */
const parseDeepObject = (
  query: Record<string, string | string[]>,
  name: string,
): Record<string, string | string[]> | undefined => {
  const prefix = `${name}[`
  const result: Record<string, string | string[]> = {}
  for (const [key, value] of Object.entries(query)) {
    if (!key.startsWith(prefix) || !key.endsWith(']')) {
      continue
    }
    const property = key.slice(prefix.length, -1)
    // `deepObject` only defines a single level of nesting, so ignore keys like `name[a][b]` whose
    // property still contains brackets rather than emitting a corrupt `a][b` property.
    if (property.includes('[') || property.includes(']')) {
      continue
    }
    result[property] = value
  }
  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Deserialize a string-encoded object parameter into its properties, following the OpenAPI
 * `style`/`explode` rules. Property values stay as strings so the caller can coerce them against the
 * object's property schemas.
 *
 * Returns `undefined` when the parameter is absent so the caller can enforce `required` separately.
 * Property values are strings, except for repeated query keys (an array-valued property such as
 * `filter[tags]=a&filter[tags]=b`), which stay as a string array.
 */
export const deserializeObjectParameter = ({
  style,
  explode,
  single,
  map,
  name,
  propertyNames,
  reservedKeys,
}: {
  style: string
  explode: boolean
  /** The single value (for example `R,100,G,200`) as read from path, query, header, or cookie */
  single: string | undefined
  /**
   * The full key/value map for the location, needed for `deepObject` (query only) and exploded `form`
   * objects (query top-level keys, or one cookie per property). A key with repeated query values carries
   * a string array so array-valued object properties survive deserialization.
   */
  map?: Record<string, string | string[]> | undefined
  name: string
  /** Declared object property names, used to gather exploded `form` objects from the location map */
  propertyNames?: string[] | undefined
  /**
   * Names of the other parameters declared in the same location. A free-form exploded object (no declared
   * properties) claims the remaining keys, so these are excluded to avoid swallowing a sibling parameter's
   * value (for example a required free-form `meta` must not be satisfied by a `limit` query key).
   */
  reservedKeys?: Set<string> | undefined
}): Record<string, string | string[]> | undefined => {
  // `deepObject`: properties are encoded as bracketed query keys, e.g. `color[R]=100`.
  if (style === 'deepObject') {
    return map ? parseDeepObject(map, name) : undefined
  }

  // Exploded `form`: each property is its own top-level key, e.g. `R=100&G=200` (one cookie per property
  // for cookies). With declared properties we gather exactly those; a free-form object (no declared
  // properties) claims every remaining key in the location, excluding keys owned by *other* declared
  // parameters. Its own name stays claimable, so a property named like the parameter is not dropped.
  if (style === 'form' && explode) {
    if (!map) {
      return undefined
    }

    const keys = propertyNames?.length
      ? propertyNames
      : Object.keys(map).filter((key) => key === name || !reservedKeys?.has(key))
    const result: Record<string, string | string[]> = {}
    for (const property of keys) {
      const value = map[property]
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

  // `label` (path): dot-prefixed. Exploded uses dot-separated `key=value`, e.g. `.R=100.G=200`;
  // non-exploded alternates comma-separated key and value, e.g. `.R,100,G,200`.
  if (style === 'label') {
    if (single === undefined) {
      return undefined
    }
    const parts = labelParts(single, explode)
    return explode ? pairsFromList(parts) : alternatingFromList(parts)
  }

  // `matrix` (path): semicolon-prefixed. Exploded repeats `;key=value` per property, e.g. `;R=100;G=200`;
  // non-exploded carries everything in one `;name=R,100,G,200` segment.
  if (style === 'matrix') {
    if (single === undefined) {
      return undefined
    }
    const segments = matrixSegments(single)
    if (explode) {
      return pairsFromList(segments)
    }
    const [first] = segments
    return first === undefined ? {} : alternatingFromList(valueAfterEquals(first).split(','))
  }

  // `spaceDelimited` / `pipeDelimited` (query): a flat alternating key,value list joined by the
  // delimiter, e.g. `R 100 G 200` or `R|100|G|200`. Only defined for the non-exploded form.
  if (style === 'spaceDelimited') {
    return parseAlternating(single, ' ')
  }
  if (style === 'pipeDelimited') {
    return parseAlternating(single, '|')
  }

  // Non-exploded `form` and `simple`: a flat list alternating key, value, e.g. `R,100,G,200`.
  return parseAlternating(single, ',')
}
