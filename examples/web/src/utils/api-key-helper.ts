/** API key storage key for localStorage */
const API_KEY_STORAGE_KEY = 'scalar-web-example-api-key'

/** Type for API key configuration */
export type ApiKeyConfig = {
  key: string
  enabled: boolean
}

/**
 * Gets the API key configuration from localStorage
 * @returns The API key configuration or null if not found
 */
export const getApiKey = (): ApiKeyConfig | null => {
  try {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY)
    if (!stored) {
      return null
    }

    const parsed = JSON.parse(stored) as ApiKeyConfig
    return parsed
  } catch (error) {
    console.error('Error reading API key from localStorage:', error)
    return null
  }
}

/**
 * Check if API key injection is enabled and has a valid key
 * @returns True if API key is enabled and has a valid key
 */
export const isApiKeyEnabled = (): boolean => {
  const config = getApiKey()
  return config?.enabled === true && Boolean(config.key?.trim())
}

/**
 * Gets the API key value if it's enabled
 * @returns The API key value if enabled, null otherwise
 */
export const getApiKeyValue = (): string | null => {
  const config = getApiKey()
  return config?.enabled && config.key ? config.key.trim() : null
}

/**
 * List of URLs that require API key injection as path segments
 */
const API_KEY_REQUIRED_URLS = [
  'https://pro-api.coingecko.com',
  'https://pro-api.coinmarketcap.com',
  'https://pro-api.defillama.com',
  'https://pro-api.llama.fi',
]

/**
 * Checks if a given URL requires API key injection in the path
 * @param url - The base URL to check
 * @returns True if the URL requires API key injection, false otherwise
 */
export const doesUrlRequireApiKey = (url: string): boolean => {
  if (!url) return false

  try {
    // Handle both full URLs and relative URLs
    const urlToCheck = url.startsWith('http') ? url : `https://${url}`
    const urlObj = new URL(urlToCheck)
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`

    return API_KEY_REQUIRED_URLS.some(
      (requiredUrl) =>
        baseUrl.toLowerCase() === requiredUrl.toLowerCase() ||
        baseUrl.toLowerCase().startsWith(requiredUrl.toLowerCase()),
    )
  } catch (error) {
    console.warn('Invalid URL format:', url, error)
    return false
  }
}

/**
 * Gets the API key if it should be used for the given URL
 * @param url - The base URL to check against
 * @returns The API key if the URL requires it and a key exists, null otherwise
 */
export const getApiKeyForUrl = (url: string): string | null => {
  const requiresApiKey = doesUrlRequireApiKey(url)

  if (!requiresApiKey) {
    return null
  }

  const apiKeyValue = getApiKeyValue()
  return apiKeyValue
}

/**
 * Injects API key into a URL if required
 * @param url - The URL to modify
 * @returns The URL with API key injected if required, otherwise the original URL
 */
export const injectApiKeyIntoUrl = (url: string): string => {
  const apiKey = getApiKeyForUrl(url)

  if (!apiKey) {
    return url
  }

  try {
    const urlObj = new URL(url)
    const pathSegments = urlObj.pathname.split('/').filter(Boolean)

    // Check if API key is already in the path
    if (pathSegments.includes(apiKey)) {
      return url
    }

    // Inject API key as the first path segment
    const newPath = `/${apiKey}/${pathSegments.join('/')}`
    urlObj.pathname = newPath

    return urlObj.toString()
  } catch (error) {
    console.warn('Failed to inject API key into URL:', url, error)
    return url
  }
}
