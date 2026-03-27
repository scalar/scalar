import { REGEX } from '@/regex/regex-helpers'
import { isRelativePath } from './is-relative-path'
import { ensureProtocol } from './ensure-protocol'

/**
 * Encodes a query parameter value for use in a URL.
 * Unlike encodeURIComponent, this preserves characters like `:`, `@`, `#`, `$`, etc.
 * that are commonly used in API query parameters and shouldn't be encoded.
 *
 * Based on RFC 3986, we only encode characters that are definitely unsafe in query values:
 * - Space becomes +
 * - % is encoded to prevent double-encoding issues
 * - & and = are encoded as they are query string delimiters
 * - [ and ] are encoded for compatibility
 */
const encodeQueryParamValue = (value: string): string => {
  return value
    .replace(/%/g, '%25') // Encode % first to avoid double-encoding
    .replace(/&/g, '%26') // & is a query string delimiter
    .replace(/=/g, '%3D') // = is a query string delimiter
    .replace(/\[/g, '%5B') // [ can cause issues
    .replace(/\]/g, '%5D') // ] can cause issues
    .replace(/ /g, '+') // Space becomes +
}

/**
 * Decodes a query parameter value.
 */
const decodeQueryParamValue = (value: string): string => {
  return value.replace(/\+/g, ' ')
}

/**
 * Converts URLSearchParams to a query string without over-encoding special characters.
 * This preserves characters like `:`, `@`, `#` that are valid in query values but
 * would be encoded by the standard URLSearchParams.toString().
 */
export const searchParamsToString = (params: URLSearchParams): string => {
  const pairs: string[] = []

  for (const [key, value] of params) {
    const encodedKey = encodeQueryParamValue(key)
    const encodedValue = encodeQueryParamValue(value)
    pairs.push(`${encodedKey}=${encodedValue}`)
  }

  return pairs.join('&')
}

/**
 * Merges multiple URLSearchParams objects, preserving multiple values per param
 * within each source, but later sources overwrite earlier ones completely
 * This should de-dupe our query params while allowing multiple keys for "arrays"
 */
export const mergeSearchParams = (...params: URLSearchParams[]): URLSearchParams => {
  // We keep a merged record to ensure the next group will overwrite the previous
  const merged: Record<string, string | string[]> = {}

  // Loops over each group and grabs unique keys
  params.forEach((p) => {
    const keys = Array.from(p.keys())
    const uniqueKeys = new Set(keys)

    uniqueKeys.forEach((key) => {
      const values = p.getAll(key)
      const value = values.length > 1 ? values : (values[0] ?? '')

      merged[key] = value
    })
  })

  const result = new URLSearchParams()

  // We maintain multiple values for each key if they existed
  Object.entries(merged).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => result.append(key, v))
    } else {
      result.append(key, value)
    }
  })

  return result
}

/** Combines a base URL and a path ensuring there's only one slash between them */
export const combineUrlAndPath = (url: string, path: string) => {
  if (!path || url === path) {
    return url.trim()
  }

  if (!url) {
    return path.trim()
  }

  return `${url.trim()}/${path.trim()}`.replace(REGEX.MULTIPLE_SLASHES, '/')
}

/**
 * Creates a URL from the path and server
 * also optionally merges query params if you include urlSearchParams
 * This was re-written without using URL to support variables in the scheme
 */
export const mergeUrls = (
  url: string,
  path: string,
  urlParams: URLSearchParams = new URLSearchParams(),
  /** To disable prefixing the url with the origin or a scheme*/
  disableOriginPrefix = false,
) => {
  // Extract and merge all query params
  if (url && (!isRelativePath(url) || typeof window !== 'undefined')) {
    /** Prefix the url with the origin if it is relative and we wish to */
    const base = disableOriginPrefix
      ? url
      : isRelativePath(url)
        ? combineUrlAndPath(window.location.origin, url)
        : ensureProtocol(url)

    // Extract search params from base URL if any
    const [baseUrl = '', baseQuery] = base.split('?')
    const baseParams = new URLSearchParams(baseQuery || '')

    // Extract search params from path if any
    const [pathWithoutQuery = '', pathQuery] = path.split('?')
    const pathParams = new URLSearchParams(pathQuery || '')

    // Merge the baseUrl and path
    const mergedUrl = url === path ? baseUrl : combineUrlAndPath(baseUrl, pathWithoutQuery)

    // Merge all search params
    const mergedSearchParams = mergeSearchParams(baseParams, pathParams, urlParams)

    // Build the final URL using our custom toString to avoid over-encoding
    const search = searchParamsToString(mergedSearchParams)
    return search ? `${mergedUrl}?${search}` : mergedUrl
  }
  if (path) {
    return combineUrlAndPath(url, path)
  }
  return ''
}
