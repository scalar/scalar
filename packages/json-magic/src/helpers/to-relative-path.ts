import { path } from '@scalar/helpers/node/path'

import { isRemoteUrl } from '@/helpers/is-remote-url'

/**
 * Returns the directory of the input path, or the input itself if it's already a directory.
 * If the input is a file (has an extension), returns its parent directory.
 */
export const getDirectory = (input: string) => {
  if (path.extname(input) !== '') {
    return path.dirname(input)
  }
  return input
}

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
  if (isRemoteUrl(input) && isRemoteUrl(base)) {
    const inputUrl = new URL(input)
    const baseUrl = new URL(base)
    // If origins aren't the same, return input as is
    if (inputUrl.origin !== baseUrl.origin) {
      return input
    }

    // Get the directory of the base URL pathname (not the file itself)
    const baseDir = getDirectory(path.resolve(baseUrl.pathname))
    const inputPath = path.resolve(inputUrl.pathname)
    // Return the relative path from baseDir to inputPath
    return path.relative(baseDir, inputPath)
  }

  // Base is a remote URL, input is a local path
  if (isRemoteUrl(base)) {
    const baseUrl = new URL(base)
    const baseDir = getDirectory(path.resolve(baseUrl.pathname))
    const inputPath = path.resolve(input)
    // Set the pathname of the base URL to the relative path and return the URL as a string
    baseUrl.pathname = path.relative(baseDir, inputPath)
    return baseUrl.toString()
  }

  // Input is a remote URL, base is a local path; just return input
  if (isRemoteUrl(input)) {
    return input
  }

  // Both input and base are local paths; return the relative path
  const baseDir = getDirectory(path.resolve(base))
  const inputPath = path.resolve(input)
  return path.relative(baseDir, inputPath)
}
