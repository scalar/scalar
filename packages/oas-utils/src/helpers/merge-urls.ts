import { ensureProtocol } from './ensure-protocol'
import { isRelativePath } from './redirectToProxy'

/**
 * Merges multiple URLSearchParams objects, preserving multiple values per param
 * within each source, but later sources overwrite earlier ones completely
 * This should de-dupe our query params while allowing multiple keys for "arrays"
 */
export const mergeSearchParams = (
  ...params: URLSearchParams[]
): URLSearchParams => {
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
  if (!path || url === path) return url.trim()

  if (!url) return path.trim()

  return `${url.trim()}/${path.trim()}`.replace(/(?<!:)\/{2,}/g, '/')
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
) => {
  // Extract and merge all query params
  if (url && (!isRelativePath(url) || typeof window !== 'undefined')) {
    /** Prefix the url with the origin if it is relative */
    const base = isRelativePath(url)
      ? combineUrlAndPath(window.location.origin, url)
      : ensureProtocol(url)

    // Extract search params from base URL if any
    const [baseUrl = '', baseQuery] = base.split('?')
    const baseParams = new URLSearchParams(baseQuery || '')

    // Extract search params from path if any
    const [pathWithoutQuery = '', pathQuery] = path.split('?')
    const pathParams = new URLSearchParams(pathQuery || '')

    // Merge the baseUrl and path
    const mergedUrl =
      url === path ? baseUrl : combineUrlAndPath(baseUrl, pathWithoutQuery)

    // Merge all search params
    const mergedSearchParams = mergeSearchParams(
      baseParams,
      pathParams,
      urlParams,
    )

    // Build the final URL
    const search = mergedSearchParams.toString()
    return search ? `${mergedUrl}?${search}` : mergedUrl
  } else if (path) {
    const combined = combineUrlAndPath(url, path)

    return isRelativePath(combined)
      ? combineUrlAndPath(window.location.origin, combined)
      : ensureProtocol(combined)
  }
  return ''
}
