import { isJsonString } from '@scalar/oas-utils'

import { useAuthenticationStore, useOpenApiStore } from '../stores'
import type { ClientRequestConfig } from '../types'
import { getRequestFromAuthentication } from './getRequestFromAuthentication'

/**
 * Enable all given parameters
 */
function enable(items?: any[]) {
  return (items ?? []).map((item) => ({ ...item, enabled: true }))
}

/**
 * Before a request is sent to the server, we’ll do some final preparation.
 *
 * - Add Content-Type header if request.body is JSON
 * - Parse request.body if it’s JSON
 * - Remove duplicate headers
 */
export const prepareClientRequestConfig = (configuration: {
  request: ClientRequestConfig
}) => {
  const { request } = configuration

  const { authentication } = useAuthenticationStore()
  const {
    openApi: { operation, globalSecurity },
  } = useOpenApiStore()

  const authenticationRequest = getRequestFromAuthentication(
    authentication,
    operation?.information?.security ?? globalSecurity,
  )

  // Merge the request with the authentication request (headers, cookies, query, etc.)
  request.headers = [
    ...(request.headers ?? []),
    ...enable(authenticationRequest.headers),
  ]

  request.cookies = [
    ...(request.cookies ?? []),
    ...enable(authenticationRequest.cookies),
  ]

  request.query = [
    ...(request.query ?? []),
    ...enable(authenticationRequest.queryString),
  ]

  // Check if request.body contains JSON
  if (request.body && isJsonString(request.body)) {
    // Check whether the request already has a Content-Type header
    const hasContentTypeHeader = request.headers?.some(
      (header) => header.name.toLowerCase() === 'content-type',
    )

    // If not, add one.
    if (!hasContentTypeHeader) {
      request.headers = [
        ...(request.headers ?? []),
        ...enable([
          {
            name: 'Content-Type',
            value: `application/json; charset=utf-8`,
          },
        ]),
      ]
    }

    request.body = JSON.parse(request.body)
  }

  return {
    ...request,
  }
}
