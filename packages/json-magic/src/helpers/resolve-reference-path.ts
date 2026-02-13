import path from 'pathe'

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

  // If the base is absolute we can compute an absolute path
  if (path.isAbsolute(base)) {
    return path.resolve(path.dirname(base), relativePath)
  }

  // If the relativePath is absolute we can return it as is
  if (path.isAbsolute(relativePath)) {
    return relativePath
  }

  // Both base and relativePath are relative paths, so we can compute a relative path
  return path.join(path.dirname(base), path.normalize(relativePath))
}
