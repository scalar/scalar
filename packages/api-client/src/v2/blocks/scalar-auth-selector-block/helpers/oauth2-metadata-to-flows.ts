import type { OAuthFlowsObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import type { OpenIDConnectDiscovery } from './fetch-openid-connect-discovery'

type FlowUpdates = { [Key in keyof OAuthFlowsObject]?: Partial<NonNullable<OAuthFlowsObject[Key]>> }

/** Supplements endpoints in declared flows. Explicit scopes, including an empty scope set, remain authoritative. */
export const oauth2MetadataToFlows = (metadata: OpenIDConnectDiscovery, flows: OAuthFlowsObject): FlowUpdates => {
  const scopes = Object.fromEntries((metadata.scopes_supported ?? []).map((scope) => [scope, '']))
  const grants = new Set(metadata.grant_types_supported ?? ['authorization_code', 'implicit'])
  const authorizationUrl = metadata.authorization_endpoint
  const tokenUrl = metadata.token_endpoint
  const discovered: FlowUpdates = {
    ...(grants.has('implicit') && authorizationUrl ? { implicit: { authorizationUrl, scopes } } : {}),
    ...(grants.has('password') && tokenUrl ? { password: { tokenUrl, scopes } } : {}),
    ...(grants.has('client_credentials') && tokenUrl ? { clientCredentials: { tokenUrl, scopes } } : {}),
    ...(grants.has('authorization_code') && authorizationUrl && tokenUrl
      ? { authorizationCode: { authorizationUrl, tokenUrl, scopes } }
      : {}),
  }
  // An empty Flows Object can discover supported grants. Otherwise the API description controls the allowed flows.
  if (!Object.keys(flows).length) {
    return discovered
  }
  return Object.fromEntries(
    Object.entries(flows)
      .filter(([, flow]) => flow)
      .map(([key, flow]): [string, Record<string, string>] => [
        key,
        {
          ...('authorizationUrl' in flow && !flow.authorizationUrl && authorizationUrl ? { authorizationUrl } : {}),
          ...('tokenUrl' in flow && !flow.tokenUrl && tokenUrl ? { tokenUrl } : {}),
        },
      ])
      .filter(([, update]) => Object.keys(update).length > 0),
  )
}
