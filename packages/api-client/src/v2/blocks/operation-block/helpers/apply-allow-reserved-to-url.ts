/**
 * Reserved characters we can safely decode in query values when OpenAPI
 * `allowReserved` is enabled.
 *
 * We intentionally keep percent-encodings for characters that can break query
 * parsing (`#`, `&`, `=`, `?`, `[`, `]`) or change x-www-form-urlencoded
 * semantics (`+`).
 *
 * @see https://spec.openapis.org/oas/v3.1.0.html#fixed-fields-10
 */
const DECODABLE_RESERVED_CHARACTERS_BY_PERCENT_ENCODING: Record<string, string> = {
  '21': '!',
  '24': '$',
  '27': "'",
  '28': '(',
  '29': ')',
  '2A': '*',
  '2C': ',',
  '2F': '/',
  '3A': ':',
  '3B': ';',
  '40': '@',
}

const decodeReservedCharacters = (value: string): string =>
  value.replace(
    /%([0-9A-Fa-f]{2})/g,
    (match, code: string) => DECODABLE_RESERVED_CHARACTERS_BY_PERCENT_ENCODING[code.toUpperCase()] ?? match,
  )

const decodeQueryKey = (key: string): string => {
  try {
    return decodeURIComponent(key.replaceAll('+', '%20'))
  } catch {
    return key
  }
}

/**
 * Decodes reserved character percent-encodings only for query keys marked with
 * OpenAPI's `allowReserved: true`.
 */
export const applyAllowReservedToUrl = (url: string, allowReservedQueryParameters: Set<string>): string => {
  if (allowReservedQueryParameters.size === 0) {
    return url
  }

  const queryStart = url.indexOf('?')
  if (queryStart === -1) {
    return url
  }

  const hashStart = url.indexOf('#', queryStart)
  const urlPrefix = url.slice(0, queryStart + 1)
  const query = hashStart === -1 ? url.slice(queryStart + 1) : url.slice(queryStart + 1, hashStart)
  const hash = hashStart === -1 ? '' : url.slice(hashStart)

  if (!query) {
    return url
  }

  const decodedQuery = query
    .split('&')
    .map((segment) => {
      if (!segment) {
        return segment
      }

      const equalsIndex = segment.indexOf('=')
      const rawKey = equalsIndex === -1 ? segment : segment.slice(0, equalsIndex)
      const key = decodeQueryKey(rawKey)

      if (!allowReservedQueryParameters.has(key) || equalsIndex === -1) {
        return segment
      }

      const rawValue = segment.slice(equalsIndex + 1)
      return `${rawKey}=${decodeReservedCharacters(rawValue)}`
    })
    .join('&')

  return `${urlPrefix}${decodedQuery}${hash}`
}
