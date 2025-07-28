import { combineUrlAndPath } from '@/url/merge-urls'

/**
 * Converts a relative URL to an absolute URL using the provided base URL or current window location.
 * @param url - The URL to make absolute
 * @param options - Configuration options
 * @param options.baseUrl - Optional base URL to resolve against (defaults to window.location.href)
 * @param options.basePath - If provided, combines with baseUrl or window.location.origin before resolving
 * @returns The absolute URL, or the original URL if it's already absolute or invalid
 */
export const makeUrlAbsolute = (
  url: string,
  {
    /** Optional base URL to resolve against (defaults to window.location.href) */
    baseUrl,
    /** If we have a basePath then we resolve against window.location.origin + basePath */
    basePath,
  }: {
    baseUrl?: string
    basePath?: string
  } = {},
): string => {
  // If no base URL provided and we're not in a browser environment, return as-is
  if (typeof window === 'undefined' && !baseUrl) {
    return url
  }

  try {
    // If we can create a URL object without a base, it's already absolute
    new URL(url)
    return url
  } catch {
    // URL is relative, proceed with resolution
  }

  // Use URL constructor which handles path normalization automatically
  try {
    let base = baseUrl || window.location.href

    // If basePath is provided, combine it with the base URL
    if (basePath) {
      const origin = baseUrl ? new URL(baseUrl).origin : window.location.origin
      base = combineUrlAndPath(origin, basePath + '/')
    }

    return new URL(url, base).toString()
  } catch {
    // If URL construction fails, return the original URL
    return url
  }
}
