import {
  type ClientRequestConfig,
  getRequestFromAuthentication,
} from '@scalar/api-client'
import {
  type AuthenticationState,
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
  operation: TransformedOperation
  authenticationState?: AuthenticationState | null
  globalSecurity?: OpenAPIV3.SecurityRequirementObject[] | null
}): ClientRequestConfig {
  const request = getHarRequest(
    {
      url: getUrlFromServerState(serverState),
    },
    getRequestFromOperation(operation, { requiredOnly: false }),
    // Only generate authentication parameters if an authentication state is passed.
    authenticationState
      ? getRequestFromAuthentication(
          authenticationState,
          operation.information?.security ?? globalSecurity ?? [],
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
    cookies: enable(request.cookies),
    query: request.queryString.map((queryString: any) => {
      const query: typeof queryString & { required?: boolean } = queryString
      return { ...queryString, enabled: query.required ?? true }
    }),
    headers: enable(request.headers),
    url: getUrlFromServerState(serverState) ?? '',
    body: request.postData?.text,
  }
}

/**
 * Enable all given parameters
 */
function enable(items?: any[]) {
  return (items ?? []).map((item) => ({ ...item, enabled: true }))
}
