import type { OpenAPIV3_2 } from '@scalar/openapi-types'

import { getPathFromUrl } from './get-open-auth-token-urls'

/** The RFC8414 fields exposed by the mock authorization server. */
type OAuth2Metadata = {
  issuer: string
  authorization_endpoint?: string
  device_authorization_endpoint?: string
  token_endpoint?: string
  response_types_supported: string[]
  grant_types_supported: string[]
  scopes_supported: string[]
}

/** Advertises local mock endpoints instead of sending clients to the real authorization server. */
export const getOAuth2Metadata = (flows: OpenAPIV3_2.OAuth2SecurityScheme['flows'], origin: string): OAuth2Metadata => {
  const authorizationFlow = flows?.authorizationCode ?? flows?.implicit
  const tokenFlow =
    flows?.authorizationCode ?? flows?.clientCredentials ?? flows?.password ?? flows?.deviceAuthorization
  const localUrl = (url: string): string => new URL(getPathFromUrl(url), origin).href
  const supportedFlows = [
    { flow: flows?.authorizationCode, grant: 'authorization_code', response: 'code' },
    { flow: flows?.implicit, grant: 'implicit', response: 'token' },
    { flow: flows?.clientCredentials, grant: 'client_credentials' },
    { flow: flows?.password, grant: 'password' },
    { flow: flows?.deviceAuthorization, grant: 'urn:ietf:params:oauth:grant-type:device_code' },
  ].filter(({ flow }) => flow)

  return {
    issuer: origin,
    ...(flows?.deviceAuthorization
      ? { device_authorization_endpoint: localUrl(flows.deviceAuthorization.deviceAuthorizationUrl || '/oauth/device') }
      : {}),
    ...(authorizationFlow
      ? { authorization_endpoint: localUrl(authorizationFlow.authorizationUrl ?? '/oauth/authorize') }
      : {}),
    ...(tokenFlow ? { token_endpoint: localUrl(tokenFlow.tokenUrl ?? '/oauth/token') } : {}),
    response_types_supported: supportedFlows.flatMap(({ response }) => (response ? [response] : [])),
    grant_types_supported: supportedFlows.map(({ grant }) => grant),
    scopes_supported: [...new Set(supportedFlows.flatMap(({ flow }) => Object.keys(flow?.scopes ?? {})))],
  }
}
