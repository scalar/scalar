import { path } from '@scalar/helpers/node/path'

import { isHttpUrl } from '@/helpers/is-http-url'

/**
 * Resolves a reference path by combining a base path with a relative path.
 * Handles both remote URLs and local file paths.
 *
 * @param base - The base path (can be a URL or local file path)
 * @param relativePath - The relative path to resolve against the base
 * @returns The resolved absolute path
 * @example
 * // Resolve remote URL
 * resolveReferencePath('https://example.com/api/schema.json', 'user.json')
 * // Returns: 'https://example.com/api/user.json'
 *
 * // Resolve local path
 * resolveReferencePath('/path/to/schema.json', 'user.json')
 * // Returns: '/path/to/user.json'
 */
export const resolveReferencePath = (base: string, relativePath: string) => {
  if (isHttpUrl(relativePath)) {
    return relativePath
  }

  if (isHttpUrl(base)) {
    const baseUrl = new URL(base)
    baseUrl.pathname = path.resolve(path.dirname(baseUrl.pathname), relativePath)
    return baseUrl.toString()
  }

  // Keep relative bases relative so local refs resolve from the input file location, not from filesystem root.
  if (!path.isAbsolute(base)) {
    return path.normalize(path.join(path.dirname(base), relativePath))
  }

  return path.resolve(path.dirname(base), relativePath)
}
