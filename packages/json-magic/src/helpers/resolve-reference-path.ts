import { path } from '@scalar/helpers/node/path'

import { isRemoteUrl } from '@/helpers/is-remote-url'

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
  if (isRemoteUrl(relativePath)) {
    return relativePath
  }

  const getDirectory = (input: string) => {
    if (path.extname(input) !== '') {
      return path.dirname(input)
    }
    return input
  }

  if (isRemoteUrl(base)) {
    const baseUrl = new URL(base)
    baseUrl.pathname = path.resolve(getDirectory(baseUrl.pathname), relativePath)
    return baseUrl.toString()
  }

  return path.resolve(getDirectory(base), relativePath)
}
