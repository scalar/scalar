import { isDefined } from '@scalar/helpers/array/is-defined'
import { isObjectLike } from '@scalar/helpers/object/is-object'

import { encodeUriComponent } from './encode-uri-component'

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
  /** OpenAPI 3.0 and 3.1 include the style prefix when a value is undefined. */
  includeUndefinedPrefix?: boolean
}

/** OpenAPI 3.2 path parameter metadata for reserved expansion. */
export type ReservedPathParameter = PathParameterSerialization

/** Encodes individual keys and values before adding OpenAPI path style delimiters. */
export const serializePathParameter = (
  name: string,
  parameter: Pick<PathParameterSerialization, 'value' | 'style' | 'explode' | 'includeUndefinedPrefix'>,
  replace: (value: string) => string,
  allowReserved = false,
): string => {
  const { value, style, explode, includeUndefinedPrefix } = parameter
  const encode = (item: unknown): string => {
    const text = replace(String(item))
    return allowReserved ? encodePathParameter(text, true) : encodeUriComponent(text)
  }
  const encodeName = (): string => {
    const encoded = encode(name)
    // RFC 6570 treats percent-encoded triplets in template variable names as literal.
    return allowReserved ? encoded : encoded.replace(/%25([0-9a-f]{2})/gi, '%$1')
  }
  const entries =
    isObjectLike(value) && !Array.isArray(value)
      ? Object.entries(value).filter(([, item]) => allowReserved || isDefined(item))
      : undefined
  const array = Array.isArray(value) ? value : undefined
  const items = allowReserved ? array : array?.filter(isDefined)

  if (!allowReserved && (!isDefined(value) || items?.length === 0 || entries?.length === 0)) {
    if (includeUndefinedPrefix && style === 'matrix') {
      return `;${encodeName()}`
    }
    return includeUndefinedPrefix && style === 'label' ? '.' : ''
  }

  const pair = (encodedKey: string, data: string): string => `${encodedKey}${data || allowReserved ? `=${data}` : ''}`
  if (style === 'matrix') {
    if (entries && explode) {
      return entries.map(([key, item]) => `;${pair(encode(key), encode(item))}`).join('')
    }

    const encodedName = encodeName()
    if (items && explode) {
      return items.map((item) => `;${pair(encodedName, encode(item))}`).join('')
    }
    const parts = entries?.flatMap(([key, item]) => [key, item]) ?? items
    if (parts) {
      return `;${encodedName}=${parts.map(encode).join(',')}`
    }
    return `;${pair(encodedName, encode(value))}`
  }

  const delimiter = style === 'label' && explode ? '.' : ','
  let data: string
  if (entries) {
    data = entries
      .map(([key, item]) => (explode ? pair(encode(key), encode(item)) : `${encode(key)}${delimiter}${encode(item)}`))
      .join(delimiter)
  } else {
    data = items ? items.map(encode).join(delimiter) : encode(value)
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
