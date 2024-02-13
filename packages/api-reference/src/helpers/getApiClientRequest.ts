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
    getRequestFromOperation(operation, { requiredOnly: false }),
    getRequestFromAuthentication(
      authenticationState,
      operation.information?.security,
    ),
  )

  const requestFromOperation = getRequestFromOperation(operation, {
    requiredOnly: false,
  })
  const variables = getParametersFromOperation(operation, 'path', false)

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
      const query: typeof queryString & { required?: boolean } = queryString
      return { ...queryString, enabled: query.required ?? true }
    }),
    headers: request.headers.map((header) => {
      return { ...header, enabled: true }
    }),
    url: getUrlFromServerState(serverState) ?? '',
    body: request.postData?.text,
  }
}
