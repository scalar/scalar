import type { LoadPlugin } from '../../utils/load/load.ts'

export const fetchUrlsDefaultConfiguration = {
  limit: 20,
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
    async get(value?: string, source?: string) {
      // Limit ht enumber of requests
      if (configuration?.limit !== false && numberOfRequests >= configuration?.limit) {
        console.warn(`[fetchUrls] Maximum number of requests reeached (${configuration?.limit}), skipping request`)
        return undefined
      }

      // Make relative URLs absolute
      const url = getAbsoluteUrl(value, source)

      try {
        numberOfRequests++

        const response = await (configuration?.fetch ? configuration.fetch(url) : fetch(url))

        return await response.text()
      } catch (error) {
        console.error('[fetchUrls]', error.message, `(${url})`)
        return undefined
      }
    },
  }
}

export function getAbsoluteUrl(value: string, source?: string | undefined) {
  // Already an absolute URL
  if (value.startsWith('http')) {
    return value
  }

  // Make it an absolute URL
  if (source) {
    // Handle file paths by joining them
    if (source.startsWith('/') || !source.startsWith('http')) {
      const sourceParts = source.split('/').filter(Boolean).slice(0, -1)
      const valueParts = value.split('/').filter(Boolean)
      const isAbsolute = source.startsWith('/')

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
  }

  // Otherwise, return the value as is
  return value
}
