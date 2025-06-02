import type { HttpMethod } from './http-methods'
import { isHttpMethod } from './is-http-method'

const DEFAULT_REQUEST_METHOD = 'get' as const

/**
 * Get a normalized request method (e.g. get, post, etc.)
 * Lowercases the method and returns the default if it is not a valid method so you will always have a valid method
 */
export const normalizeHttpMethod = (method?: string): HttpMethod => {
  // Make sure it's a string
  if (typeof method !== 'string') {
    console.warn(`Request method is not a string. Using ${DEFAULT_REQUEST_METHOD} as the default.`)

    return DEFAULT_REQUEST_METHOD
  }

  // Normalize the string
  const normalizedMethod = method.trim().toLowerCase()

  if (!isHttpMethod(normalizedMethod)) {
    console.warn(
      `${method || 'Request method'} is not a valid request method. Using ${DEFAULT_REQUEST_METHOD} as the default.`,
    )

    return DEFAULT_REQUEST_METHOD
  }

  return normalizedMethod
}
