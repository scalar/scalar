/**
 * API Key Manager for storing and retrieving API keys that get injected as path segments
 * Format: {baseUrl}/{apiKey}/{endpoint}
 */

const API_KEY_STORAGE_PREFIX = 'scalar-api-key'

export type ApiKeyConfig = {
  /** The API key value */
  key: string
  /** Whether API key injection is enabled for this workspace */
  enabled: boolean
  /** Optional description for the API key */
  description?: string
}

/**
 * Generate storage key for workspace-specific API keys
 */
const getStorageKey = (workspaceId: string): string => {
  return `${API_KEY_STORAGE_PREFIX}-${workspaceId}`
}

/**
 * Save API key configuration for a workspace
 */
export const saveApiKey = (workspaceId: string, config: ApiKeyConfig): void => {
  try {
    localStorage.setItem(getStorageKey(workspaceId), JSON.stringify(config))
  } catch (error) {
    console.warn('Failed to save API key to localStorage:', error)
  }
}

/**
 * Gets the API key configuration for a workspace
 *
 * @param workspaceId - The workspace identifier
 * @returns The API key configuration or null if not found
 */
export const getApiKey = (workspaceId: string): ApiKeyConfig | null => {
  const storageKey = getStorageKey(workspaceId)

  try {
    const stored = localStorage.getItem(storageKey)

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
 * Remove API key configuration for a workspace
 */
export const removeApiKey = (workspaceId: string): void => {
  try {
    localStorage.removeItem(getStorageKey(workspaceId))
  } catch (error) {
    console.warn('Failed to remove API key from localStorage:', error)
  }
}

/**
 * Check if API key injection is enabled and has a valid key
 */
export const isApiKeyEnabled = (workspaceId: string): boolean => {
  const config = getApiKey(workspaceId)
  return config?.enabled === true && Boolean(config.key?.trim())
}

/**
 * Gets the API key value if it's enabled for the workspace
 *
 * @param workspaceId - The workspace identifier
 * @returns The API key value if enabled, null otherwise
 */
export const getApiKeyValue = (workspaceId: string): string | null => {
  const config = getApiKey(workspaceId)

  const result = config?.enabled && config.key ? config.key.trim() : null

  return result
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
 *
 * @param url - The base URL to check
 * @returns true if the URL requires API key injection, false otherwise
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
 * Gets the API key for a workspace and checks if it should be used for the given URL
 *
 * @param workspaceId - The workspace identifier
 * @param url - The base URL to check against
 * @returns The API key if the URL requires it and a key exists, null otherwise
 */
export const getApiKeyForUrl = (workspaceId: string, url: string): string | null => {
  const requiresApiKey = doesUrlRequireApiKey(url)

  if (!requiresApiKey) {
    return null
  }

  const apiKeyValue = getApiKeyValue(workspaceId)

  return apiKeyValue
}
