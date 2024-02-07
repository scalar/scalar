import { isRequestMethod } from '../fixtures'

const defaultRequestMethod = 'GET'

/**
 * Get a normalized request method (e.g. GET, POST, etc.)
 */
export const normalizeRequestMethod = (method?: string) => {
  // Make sure it’s a string
  if (typeof method !== 'string') {
    console.warn(
      `[sendRequest] Request method is not a string. Using ${defaultRequestMethod} as the default.`,
    )

    return defaultRequestMethod
  }

  // Normalize the string
  const normalizedMethod = method.trim().toUpperCase()

  if (!isRequestMethod(normalizedMethod)) {
    console.warn(
      `[sendRequest] ${method} is not a valid request method. Using ${defaultRequestMethod} as the default.`,
    )

    return defaultRequestMethod
  }

  return normalizedMethod
}
