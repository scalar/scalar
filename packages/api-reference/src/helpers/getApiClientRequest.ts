import {
  type AuthenticationState,
  type ClientRequestConfig,
  getRequestFromAuthentication,
} from '@scalar/api-client'
import {
  type TransformedOperation,
  getHarRequest,
  getParametersFromOperation,
  getRequestFromOperation,
} from '@scalar/oas-utils'
import type { OpenAPIV3 } from '@scalar/openapi-parser'

import type { ServerState } from '../types'
import { getUrlFromServerState } from './'

/**
 * Generate parameters for the request
 */
export function getApiClientRequest({
  serverState,
  authenticationState,
  operation,
  globalSecurity,
}: {
  serverState: ServerState
  authenticationState: AuthenticationState
  operation: TransformedOperation
  globalSecurity?: OpenAPIV3.SecurityRequirementObject[]
}): ClientRequestConfig {
  const request = getHarRequest(
    {
      url: getUrlFromServerState(serverState),
    },
    getRequestFromOperation(operation, { requiredOnly: false }),
    authenticationState
      ? getRequestFromAuthentication(
          authenticationState,
          operation.information?.security ?? globalSecurity,
        )
      : {},
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
