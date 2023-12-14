import type { ClientRequestConfig } from '@scalar/api-client'

import type {
  AuthenticationState,
  ServerState,
  TransformedOperation,
} from '../types'
import {
  getHarRequest,
  getParametersFromOperation,
  getRequestFromAuthentication,
  getRequestFromOperation,
  getUrlFromServerState,
} from './'

/**
 * Generate parameters for the request
 */
export function getApiClientRequest({
  serverState,
  authenticationState,
  operation,
}: {
  serverState: ServerState
  authenticationState: AuthenticationState
  operation: TransformedOperation
}): ClientRequestConfig {
  const request = getHarRequest(
    {
      url: getUrlFromServerState(serverState),
    },
    getRequestFromOperation(operation),
    getRequestFromAuthentication(authenticationState),
  )

  const requestFromOperation = getRequestFromOperation(operation)
  const variables = getParametersFromOperation(operation, 'path')

  return {
    id: operation.operationId,
    name: operation.name,
    type: request.method,
    path: requestFromOperation.path ?? '',
    variables,
    cookies: request.cookies.map((cookie) => {
      return { ...cookie, enabled: true }
    }),
    query: request.queryString.map((queryString) => {
      return { ...queryString, enabled: true }
    }),
    headers: request.headers.map((header) => {
      return { ...header, enabled: true }
    }),
    url: getUrlFromServerState(serverState) ?? '',
    body: request.postData?.text,
  }
}
