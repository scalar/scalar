import type { ClientRequestConfig } from '@scalar/api-client'

import type {
  AuthenticationState,
  ServerState,
  TransformedOperation,
} from '../types'
import {
  getHarRequest,
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

  return {
    id: operation.operationId,
    name: operation.name,
    type: request.method,
    path: requestFromOperation.path ?? '',
    parameters: (operation.information.parameters ?? []).map((parameter) => {
      return {
        name: parameter.name,
        value: '',
      }
    }),
    cookies: request.cookies,
    query: request.queryString,
    headers: request.headers,
    url: getUrlFromServerState(serverState) ?? '',
    body: request.postData?.text,
  }
}
