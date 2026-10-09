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
export type ReservedPathParameter = {
  /** Structured input retains array items and object entries for style delimiters. */
  value: unknown
  /** Original preview value lets request hooks override path.variables. */
  originalValue: string
  style: string
  explode: boolean
}

/** Serializes OpenAPI reserved path expansion without exposing forbidden delimiters. */
export const serializeReservedPathParameter = (
  name: string,
  parameter: Pick<ReservedPathParameter, 'value' | 'style' | 'explode'>,
  replace: (value: string) => string = (value) => value,
): string => {
  const { value, style, explode } = parameter
  const encode = (item: unknown): string => encodePathParameter(replace(String(item)), true)
  const entries = isObjectLike(value) && !Array.isArray(value) ? Object.entries(value) : undefined
  const array = Array.isArray(value) ? value : undefined

  if (style === 'matrix') {
    if (entries && explode) {
      return entries.map(([key, item]) => `;${encode(key)}=${encode(item)}`).join('')
    }
    if (array && explode) {
      return array.map((item) => `;${encode(name)}=${encode(item)}`).join('')
    }
    const data = entries
      ? entries.flatMap(([key, item]) => [encode(key), encode(item)]).join(',')
      : array
        ? array.map(encode).join(',')
        : encode(value)
    return `;${encode(name)}=${data}`
  }

  const delimiter = style === 'label' && explode ? '.' : ','
  const data = entries
    ? entries
        .map(([key, item]) =>
          explode ? `${encode(key)}=${encode(item)}` : `${encode(key)}${delimiter}${encode(item)}`,
        )
        .join(delimiter)
    : array
      ? array.map(encode).join(delimiter)
      : encode(value)
  return style === 'label' ? `.${data}` : data
}

/** Rejects dot segments that browser URL parsing would silently remove. */
export const assertReservedPathUrl = (url: string): void => {
  const path = url.split(/[?#]/, 1)[0] ?? ''
  if (path.split('/').some((segment) => /^(?:\.|%2e){1,2}$/i.test(segment))) {
    throw new URIError('Reserved path parameters cannot form dot segments because browsers normalize them.')
  }
}
