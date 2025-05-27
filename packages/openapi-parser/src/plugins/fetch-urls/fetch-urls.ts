import type { LoadPlugin } from '@/utils/load/load'

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
    check(value?: any) {
      // Not a string
      if (typeof value !== 'string') {
        return false
      }

      // Not http/https
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return false
      }

      return true
    },
    async get(value?: any) {
      // Limit ht enumber of requests
      if (configuration?.limit !== false && numberOfRequests >= configuration?.limit) {
        console.warn(`[fetchUrls] Maximum number of requests reeached (${configuration?.limit}), skipping request`)
        return undefined
      }

      try {
        numberOfRequests++

        const response = await (configuration?.fetch ? configuration.fetch(value) : fetch(value))

        return await response.text()
      } catch (error) {
        console.error('[fetchUrls]', error.message, `(${value})`)
        return undefined
      }
    },
  }
}
