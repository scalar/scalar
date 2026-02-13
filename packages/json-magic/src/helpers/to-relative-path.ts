import { path } from '@scalar/helpers/node/path'

import { isHttpUrl } from '@/helpers/is-http-url'

/**
 * Converts an input path or URL to a relative path based on the provided base.
 * Handles both remote URLs and local file system paths.
 * - If both input and base are remote URLs and share the same origin, computes the relative pathname.
 * - If base is a remote URL but input is local, returns a remote URL with a relative pathname.
 * - If input is a remote URL but base is local, returns input as is.
 * - Otherwise, computes the relative path between two local paths.
 */
export const toRelativePath = (input: string, base: string) => {
  // Both input and base are remote URLs
  if (isHttpUrl(input) && isHttpUrl(base)) {
    const inputUrl = new URL(input)
    const baseUrl = new URL(base)
    // If origins aren't the same, return input as is
    if (inputUrl.origin !== baseUrl.origin) {
      return input
    }

    // Get the directory of the base URL pathname (not the file itself)
    const baseDir = path.dirname(path.resolve(baseUrl.pathname))
    const inputPath = path.resolve(inputUrl.pathname)
    // Return the relative path from baseDir to inputPath
    return path.relative(baseDir, inputPath)
  }

  // Base is a remote URL, input is a local path
  if (isHttpUrl(base)) {
    const baseUrl = new URL(base)
    const baseDir = path.dirname(path.resolve(baseUrl.pathname))
    const inputPath = path.resolve(input)
    // Set the pathname of the base URL to the relative path and return the URL as a string
    baseUrl.pathname = path.relative(baseDir, inputPath)
    return baseUrl.toString()
  }

  // Input is a remote URL, base is a local path; just return input
  if (isHttpUrl(input)) {
    return input
  }

  // If the base is a relative path, we can't compute the relative path so return the input as is
  if (!path.isAbsolute(base)) {
    return path.normalize(input)
  }

  // Both input and base are local paths; return the relative path
  const baseDir = path.dirname(path.resolve(base))
  const inputPath = path.resolve(input)
  return path.relative(baseDir, inputPath)
}
