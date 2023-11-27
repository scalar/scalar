/**
 * Normalizes a path by removing leading slashes.
 */
export const normalizePath = (path?: string) => {
  if (typeof path !== 'string') {
    return ''
  }

  let normalizedPath = path.trim()

  if (normalizedPath.length > 1 && normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.slice(1)
  }

  return normalizedPath
}
