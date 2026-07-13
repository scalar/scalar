import type { HttpMethod } from './http-methods'
import { isHttpMethod } from './is-http-method'

const DEFAULT_REQUEST_METHOD = 'get' as const
const HTTP_METHOD_TOKEN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/

/**
 * Get a normalized request method.
 * Standard methods are lowercased; custom HTTP method tokens are preserved for OpenAPI 3.2 additionalOperations.
 */
export const normalizeHttpMethod = (method?: string): HttpMethod => {
  // Make sure it's a string
  if (typeof method !== 'string') {
    console.warn(`Request method is not a string. Using ${DEFAULT_REQUEST_METHOD} as the default.`)

    return DEFAULT_REQUEST_METHOD
  }

  // Normalize the string
  const trimmedMethod = method.trim()
  const normalizedMethod = trimmedMethod.toLowerCase()

  if (!trimmedMethod || !HTTP_METHOD_TOKEN.test(trimmedMethod)) {
    console.warn(
      `${trimmedMethod || 'Request method'} is not a valid request method. Using ${DEFAULT_REQUEST_METHOD} as the default.`,
    )

    return DEFAULT_REQUEST_METHOD
  }

  return isHttpMethod(normalizedMethod) ? normalizedMethod : (trimmedMethod as HttpMethod)
}
