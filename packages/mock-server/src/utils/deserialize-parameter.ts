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
