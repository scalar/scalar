import type { LoadPlugin } from '../../utils/load/load.ts'

export const fetchUrlsDefaultConfiguration = {
  limit: 100,
}

export const fetchUrls: (customConfiguration?: {
  /**
   * Limit the number of requests. Set to `false` to disable the limit.
   */
  limit?: number | false
  /**
   * Fetch function to use instead of the global fetch. Use this to intercept requests.
   */
  fetch?: (url: string) => Promise<Response>
}) => LoadPlugin = (customConfiguration) => {
  // State
  let numberOfRequests = 0

  // Configuration
  const configuration = {
    ...fetchUrlsDefaultConfiguration,
    ...customConfiguration,
  }

  return {
    // Make it run after readFiles
    priority: 0,
    check(value?: unknown): value is string {
      // Not a string
      if (typeof value !== 'string') {
        return false
      }

      // Seems to be JSON
      if (value.startsWith('{') || value.startsWith('[')) {
        return false
      }

      // Seems to be YAML
      if (value.includes('\n')) {
        return false
      }

      return true
    },
    async get(url?: string) {
      // Limit ht enumber of requests
      if (configuration?.limit !== false && numberOfRequests >= configuration?.limit) {
        console.warn(`[fetchUrls] Maximum number of requests reeached (${configuration?.limit}), skipping request`)
        return undefined
      }

      try {
        numberOfRequests++

        const response = await (configuration?.fetch ? configuration.fetch(url) : fetch(url))

        return await response.text()
      } catch (error) {
        console.error('[fetchUrls]', error.message, `(${url})`)
        return undefined
      }
    },
    getUri(value: string, source?: unknown) {
      return getAbsoluteUrl(value, source)
    },
  }
}

export function getAbsoluteUrl(value: string, source?: unknown) {
  if (typeof source !== 'string') {
    return value
  }

  // Already an absolute URL
  if (value.startsWith('http')) {
    return value
  }

  // Make it an absolute URL
  if (source) {
    // Skip if source or value is JSON/YAML content
    if (
      source.startsWith('{') ||
      source.startsWith('[') ||
      source.includes('\n') ||
      value.startsWith('{') ||
      value.startsWith('[') ||
      value.includes('\n')
    ) {
      return value
    }

    try {
      // If source is an HTTP URL, handle both absolute and relative paths
      if (source.startsWith('http')) {
        const sourceUrl = new URL(source)

        // If value starts with /, treat it as relative to the host root
        if (value.startsWith('/')) {
          // Simply combine the origin with the absolute path
          return `${sourceUrl.origin}${value}`
        }

        // Otherwise treat it as relative to the source URL's directory
        return new URL(value, sourceUrl.href).toString()
      }

      // Handle file system paths
      if (source.startsWith('/') || !source.startsWith('http')) {
        const sourceParts = source.split('/').filter(Boolean).slice(0, -1)
        const valueParts = value.split('/').filter(Boolean)
        const isAbsolute = source.startsWith('/')

        // If value is absolute path, start fresh
        if (value.startsWith('/')) {
          return value
        }

        // Process each part of the path
        const resultParts = [...sourceParts]
        for (const part of valueParts) {
          if (part === '..') {
            resultParts.pop()
          } else if (part !== '.') {
            resultParts.push(part)
          }
        }

        // Preserve the leading slash for absolute paths, but avoid double slashes
        return isAbsolute ? '/' + resultParts.join('/') : resultParts.join('/')
      }

      return new URL(value, source).toString()
    } catch (error) {
      console.warn('[fetchUrls] Failed to resolve URL:', error.message, `(${value})`)
      return value
    }
  }

  // Otherwise, return the value as is
  return value
}
