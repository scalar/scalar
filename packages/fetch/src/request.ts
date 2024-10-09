import { formatApiError, formatApiResponse } from './format'
import { schemaModel } from './schemaModel'
import type { RequestConfig } from './types'

export async function request<T>({
  disableAuth = false,
  accessToken,
  baseUrl,
  url,
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
  const requestUrl = (url.includes('http') ? url : `${baseUrl}/${url}`).replace(
    /([^:]\/)\/+/g,
    '$1',
  )

  // Execute the fetch and handle all errors
  return fetch(requestUrl, {
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
        console.error(`Response Zod validation error for ${requestUrl}`)
        // Generic message when response validation fails
        return formatApiError(
          `Invalid response data from endpoint: ${requestUrl}`,
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
