const defaultRequestMethod = 'GET'

// TODO: Support all request methods
export const validRequestMethods = [
  'GET',
  'POST',
  'PUT',
  // 'HEAD',
  'DELETE',
  'PATCH',
  // 'OPTIONS',
  // 'CONNECT',
  // 'TRACE',
]

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

  // Make sure it’s a valid request method
  const isValidRequestMethod = validRequestMethods.includes(normalizedMethod)

  if (!isValidRequestMethod) {
    console.warn(
      `[sendRequest] ${method} is not a valid request method. Using ${defaultRequestMethod} as the default.`,
    )

    return defaultRequestMethod
  }

  return normalizedMethod
}
