import type { ZodSchema, ZodTypeDef } from 'zod'

/** Parse an value from a given schema with optional error or null return */
export function schemaModel<T, I = any>(
  data: I,
  schema: ZodSchema<T, ZodTypeDef, any>,
  throwError?: true,
): T
export function schemaModel<T, I = any>(
  data: I,
  schema: ZodSchema<T, ZodTypeDef, any>,
  throwError?: false,
): T | null
export function schemaModel<T, I = any>(
  data: I,
  schema: ZodSchema<T, ZodTypeDef, any>,
  throwError = true,
) {
  const result = schema.safeParse(data)

  if (!result.success) {
    console.error('Zod Schema Error')
    console.group()
    result.error.issues.forEach((issue) => {
      console.log(`Path: ${issue.path.join(', ')} \nError: ${issue.message}`)
    })

    console.groupEnd()
  }

  if (throwError && !result.success) throw new Error('Zod validation failure')

  return result.success ? result.data : null
}

export type APIResponse<T> = {
  status: number
  data: T
  error: false
}

export type APIError = {
  status: number
  message: string
  error: true
  originalError: any
}

/** Create a standardized API return object */
function formatApiResponse<T>(data: T, status: number): APIResponse<T> {
  return {
    status,
    data,
    error: false,
  }
}

/** Create a standardized API Error object */
function formatApiError(
  message: string,
  status: number,
  error: any = null,
): APIError {
  return {
    status,
    message,
    error: true,
    originalError: error,
  }
}

export type RequestConfig<T> = Omit<RequestInit, 'body'> & {
  // why do we omit the body param?
  baseUrl?: string
  requestUrl: string
  accessToken?: string
  schema: ZodSchema<T, ZodTypeDef, any>
  disableAuth?: boolean // Require explicit flag to disable auth
  headers?: Record<string, string>
  data?: Record<string, any> | FormData | null
  method: 'post' | 'get' | 'delete' | 'put' | 'patch'
}

export async function request<T>({
  disableAuth = false,
  accessToken,
  baseUrl,
  requestUrl,
  schema,
  data,
  ...config
}: RequestConfig<T>) {
  // Normalize headers
  const headers: { [x: string]: string } = {}

  // eslint-disable-next-line guard-for-in
  for (const headerKey in config.headers) {
    headers[headerKey.toLowerCase()] = config.headers[headerKey].toLowerCase()
  }

  // Default to JSON content if not specified
  if (!('content-type' in headers)) headers['content-type'] = 'application/json'

  // Must let the browser set content header for form data
  if (data instanceof FormData) delete headers['content-type']

  // Add the bearer auth unless disabled
  if (!disableAuth) {
    if (!accessToken)
      console.warn('WARNING: Auth token function returned an empty value')

    headers['authorization'] = `Bearer ${accessToken}`
  }

  // Allow overriding of the base URL. Remove duplicate slashes
  const url = (
    requestUrl.includes('http') ? requestUrl : `${baseUrl}/${requestUrl}`
  ).replace(/([^:]\/)\/+/g, '$1')

  // Execute the fetch and handle all errors
  return fetch(url, {
    ...config,
    body:
      data instanceof FormData || data === undefined
        ? data
        : JSON.stringify(data),
    headers,
  })
    .then(async (response) => {
      const isJson = response.headers
        .get('content-type')
        ?.includes('application/json')

      // For bad status codes we parse the response
      if (response.status >= 300) {
        const message = isJson
          ? String(
              (
                await response
                  .json()
                  .catch(() => ({ message: 'Invalid response' }))
              ).message,
            ) || 'Unknown Error'
          : await response.text().catch(() => 'Invalid response')
        return formatApiError(message, response.status)
      }

      // Validate the response data and return
      try {
        // Get the response data
        const baseData =
          response.ok && isJson
            ? await response.json().catch(() => {
                console.error(
                  `Invalid JSON response from API service from ${url}`,
                )
                return null
              })
            : await response.text()

        // When a schema is provided we thrown an error on validation failure
        const resultData: T = schema
          ? schemaModel(baseData, schema, true)
          : baseData

        return formatApiResponse(resultData, response.status)
      } catch (err) {
        console.error(`Response Zod validation error for ${url}`)
        // Generic message when response validation fails
        return formatApiError(
          `Invalid response data from endpoint: ${url}`,
          500,
        )
      }
    })
    .catch((err) => {
      // Catch and log any unexpected errors
      console.error(err)
      return formatApiError('Unknown Error', 500)
    })
}
