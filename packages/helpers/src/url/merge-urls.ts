import { REGEX } from '@/regex/regex-helpers'

import { ensureProtocol } from './ensure-protocol'
import { isRelativePath } from './is-relative-path'

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

const joinUrlAndPath = (url: string, path: string, preservePathSegments: boolean): string => {
  if (!path || url === path) {
    return url.trim()
  }

  if (!url) {
    return path.trim()
  }

  if (!preservePathSegments) {
    return `${url.trim()}/${path.trim()}`.replace(REGEX.MULTIPLE_SLASHES, '/')
  }

  // Keep the first slash after a scheme so the separator can complete its delimiter.
  const baseUrl = url.trim().replace(/(^|:\/|[^/:])\/+$/, '$1')
  const relativePath = path.trim().replace(/^\/+/, '')
  return `${baseUrl}/${relativePath}`
}

/** Combines a base URL and path and collapses consecutive slashes after the scheme. */
export const combineUrlAndPath = (url: string, path: string): string => joinUrlAndPath(url, path, false)

/**
 * Creates a URL from the path and server, preserving empty path segments on either side of the join.
 *
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
  const preservePathSegments = true

  // Extract and merge all query params
  if (url && (!isRelativePath(url) || typeof window !== 'undefined')) {
    /** Prefix the url with the origin if it is relative and we wish to */
    let base = url
    if (!disableOriginPrefix) {
      base = isRelativePath(url)
        ? joinUrlAndPath(window.location.origin, url, preservePathSegments)
        : ensureProtocol(url)
    }

    // Extract search params from base URL if any
    const baseQueryIndex = base.indexOf('?')
    const baseUrl = baseQueryIndex === -1 ? base : base.slice(0, baseQueryIndex)
    const baseQuery = baseQueryIndex === -1 ? '' : base.slice(baseQueryIndex + 1)
    const baseParams = new URLSearchParams(baseQuery || '')

    // Extract search params from path if any
    const pathQueryIndex = path.indexOf('?')
    const pathWithoutQuery = pathQueryIndex === -1 ? path : path.slice(0, pathQueryIndex)
    const pathQuery = pathQueryIndex === -1 ? '' : path.slice(pathQueryIndex + 1)
    const pathParams = new URLSearchParams(pathQuery || '')

    // Merge the baseUrl and path
    const mergedUrl = url === path ? baseUrl : joinUrlAndPath(baseUrl, pathWithoutQuery, preservePathSegments)

    // Merge all search params
    const mergedSearchParams = mergeSearchParams(baseParams, pathParams, urlParams)

    // Build the final URL
    const search = mergedSearchParams.toString()
    return search ? `${mergedUrl}?${search}` : mergedUrl
  }
  if (path) {
    return joinUrlAndPath(url, path, preservePathSegments)
  }
  return ''
}
