import { OpenIDConnectSchema, type SecretsOpenIdConnect } from '@scalar/workspace-store/entities/auth'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { OAuthFlowsObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type { OpenIDConnectDiscovery } from './fetch-openid-connect-discovery'

/** Takes in an open ID Connect discovery response and converts it into an oauth flow to be used for authorization */
export const openIDDiscoveryToFlows = (discovery: OpenIDConnectDiscovery): SecretsOpenIdConnect => {
  const scopes = Object.fromEntries((discovery.scopes_supported ?? []).map((scope) => [scope, '']))
  const grantTypes = new Set(discovery.grant_types_supported ?? ['authorization_code', 'implicit'])
  const authorizationUrl = discovery.authorization_endpoint
  const tokenUrl = discovery.token_endpoint

  const usePkce = discovery.code_challenge_methods_supported?.includes('S256')
    ? 'SHA-256'
    : discovery.code_challenge_methods_supported?.includes('plain')
      ? 'plain'
      : 'no'

  const flows: OAuthFlowsObject = {}

  // Implicit
  if (grantTypes.has('implicit') && authorizationUrl) {
    flows.implicit = {
      authorizationUrl,
      refreshUrl: authorizationUrl,
      scopes,
    }
  }

  // Password
  if (grantTypes.has('password') && tokenUrl) {
    flows.password = {
      tokenUrl,
      refreshUrl: tokenUrl,
      scopes,
    }
  }

  // Client Credentials
  if (grantTypes.has('client_credentials') && tokenUrl) {
    flows.clientCredentials = {
      tokenUrl,
      refreshUrl: tokenUrl,
      scopes,
    }
  }

  // Authorization Code
  if (grantTypes.has('authorization_code') && authorizationUrl && tokenUrl) {
    flows.authorizationCode = {
      authorizationUrl,
      tokenUrl,
      refreshUrl: tokenUrl,
      'x-usePkce': usePkce,
      scopes,
    }
  }

  return coerceValue(OpenIDConnectSchema, flows)
}
