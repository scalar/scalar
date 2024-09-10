import type { RequestMethod } from '@scalar/oas-utils/entities/spec'

import { isRequestMethod } from '../fixtures'

const DEFAULT_REQUEST_METHOD = 'get'

/**
 * Get a normalized request method (e.g. GET, POST, etc.)
 */
export const normalizeRequestMethod = (method?: string): RequestMethod => {
  // Make sure it’s a string
  if (typeof method !== 'string') {
    console.warn(
      `Request method is not a string. Using ${DEFAULT_REQUEST_METHOD} as the default.`,
    )

    return DEFAULT_REQUEST_METHOD
  }

  // Normalize the string
  const normalizedMethod = method.trim().toUpperCase()

  if (!isRequestMethod(normalizedMethod)) {
    console.warn(
      `${method} is not a valid request method. Using ${DEFAULT_REQUEST_METHOD} as the default.`,
    )

    return DEFAULT_REQUEST_METHOD
  }

  return normalizedMethod as RequestMethod
}
