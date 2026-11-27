import { isObjectLike } from '@scalar/helpers/object/is-object'

/**
 * Encodes a path parameter, preserving only path-safe reserved characters and
 * existing percent-encoded triples when OpenAPI reserved expansion is enabled.
 * Slashes, query/fragment delimiters, and brackets must remain escaped.
 */
export const encodePathParameter = (value: string, allowReserved = false): string => {
  if (!allowReserved) {
    return encodeURIComponent(value)
  }
  return value.replace(/%[0-9a-f]{2}|[\s\S]/giu, (character) =>
    /^%[0-9a-f]{2}$/i.test(character) || /^[!$&'()*+,;=:@]$/.test(character)
      ? character
      : encodeURIComponent(character),
  )
}

/** Style metadata retained until environment substitution and path encoding. */
export type PathParameterSerialization = {
  /** Structured input retains array items and object entries for style delimiters. */
  value: unknown
  /** Original preview value lets request hooks override path.variables. */
  originalValue: string
  style: string
  explode: boolean
}

/** OpenAPI 3.2 path parameter metadata for reserved expansion. */
export type ReservedPathParameter = PathParameterSerialization

/** Encodes individual keys and values before adding OpenAPI path style delimiters. */
export const serializePathParameter = (
  name: string,
  parameter: Pick<PathParameterSerialization, 'value' | 'style' | 'explode'>,
  replace: (value: string) => string,
  allowReserved = false,
): string => {
  const { value, style, explode } = parameter
  const encode = (item: unknown): string => {
    const encoded = encodePathParameter(replace(String(item)), allowReserved)
    // Ordinary URI Template expansion only leaves unreserved characters intact.
    return allowReserved
      ? encoded
      : encoded.replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
  }
  const entries = isObjectLike(value) && !Array.isArray(value) ? Object.entries(value) : undefined
  const array = Array.isArray(value) ? value : undefined

  if (!allowReserved && (array?.length === 0 || entries?.length === 0)) {
    return ''
  }

  if (style === 'matrix') {
    const pair = (key: string, data: string): string => `;${encode(key)}${data || allowReserved ? `=${data}` : ''}`
    if (entries && explode) {
      return entries.map(([key, item]) => pair(key, encode(item))).join('')
    }
    if (array && explode) {
      return array.map((item) => pair(name, encode(item))).join('')
    }
    const parts = entries ? entries.flatMap(([key, item]) => [key, item]) : (array ?? [value])
    return pair(name, parts.map(encode).join(','))
  }

  const delimiter = style === 'label' && explode ? '.' : ','
  let data: string
  if (entries) {
    data = entries
      .map(([key, item]) => (explode ? `${encode(key)}=${encode(item)}` : `${encode(key)}${delimiter}${encode(item)}`))
      .join(delimiter)
  } else {
    data = array ? array.map(encode).join(delimiter) : encode(value)
  }
  return style === 'label' ? `.${data}` : data
}

/** Serializes OpenAPI reserved path expansion without exposing forbidden delimiters. */
export const serializeReservedPathParameter = (
  name: string,
  parameter: Pick<ReservedPathParameter, 'value' | 'style' | 'explode'>,
  replace: (value: string) => string = (value) => value,
): string => serializePathParameter(name, parameter, replace, true)

/** Rejects dot segments that browser URL parsing would silently remove. */
export const assertReservedPathUrl = (url: string): void => {
  const path = url.split(/[?#]/, 1)[0] ?? ''
  if (path.split('/').some((segment) => /^(?:\.|%2e){1,2}$/i.test(segment))) {
    throw new URIError('Path parameters cannot form dot segments because browsers normalize them.')
  }
}
