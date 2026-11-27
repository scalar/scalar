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

const joinUrlAndPath = (url: string, path: string, preservePathSegments: boolean, appendPath = false): string => {
  if (!path || (!appendPath && url === path)) {
    return url.trim()
  }

  if (!url) {
    return path.trim()
  }

  if (!preservePathSegments) {
    return `${url.trim()}/${path.trim()}`.replace(REGEX.MULTIPLE_SLASHES, '/')
  }

  const base = url.trim()
  const baseUrl = base.replace(/(^|[^/])\/+$/, '$1')
  // Only a standalone scheme needs an extra slash to complete its delimiter.
  const separator = /^(?:[a-z][a-z\d+.-]*|\{[^{}]+\}|\{\{[^{}]+\}\}):\/+$/i.test(base) ? '//' : '/'
  const relativePath = path.trim().replace(/^\/+/, '')
  return `${baseUrl}${separator}${relativePath}`
}

/** Combines a base URL and path, optionally retaining consecutive slashes inside either part. */
export const combineUrlAndPath = (
  url: string,
  path: string,
  { preservePathSegments = false }: { preservePathSegments?: boolean } = {},
): string => joinUrlAndPath(url, path, preservePathSegments)

type MergeUrlOptions = {
  /** Append an operation path starting with / even when it matches the resolved server URL. */
  appendPath?: boolean
  /** Keep relative URLs relative and leave a missing scheme untouched. */
  disableOriginPrefix?: boolean
}

/**
 * Creates a URL from the path and server. The options object preserves interior empty path segments.
 *
 * Query parameters are merged when provided. The join accepts unresolved variables in the scheme.
 * A boolean fourth argument controls whether to skip adding an origin or scheme.
 */
export const mergeUrls = (
  url: string,
  path: string,
  urlParams: URLSearchParams = new URLSearchParams(),
  options: MergeUrlOptions | boolean = false,
): string => {
  const appendPath = typeof options !== 'boolean' && options.appendPath === true && path.startsWith('/')
  const disableOriginPrefix = typeof options === 'boolean' ? options : options.disableOriginPrefix
  const preservePathSegments = typeof options !== 'boolean'

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
    const mergedUrl =
      !appendPath && url === path
        ? baseUrl
        : joinUrlAndPath(baseUrl, pathWithoutQuery, preservePathSegments, appendPath)

    // Merge all search params
    const mergedSearchParams = mergeSearchParams(baseParams, pathParams, urlParams)

    // Build the final URL
    const search = mergedSearchParams.toString()
    return search ? `${mergedUrl}?${search}` : mergedUrl
  }
  if (path) {
    return joinUrlAndPath(url, path, preservePathSegments, appendPath)
  }
  return ''
}
