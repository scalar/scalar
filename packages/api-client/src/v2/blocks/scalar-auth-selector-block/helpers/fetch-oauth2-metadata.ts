import type { ErrorResponse } from '@scalar/helpers/errors/normalize-error'
import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import { redirectToProxy } from '@scalar/helpers/url/redirect-to-proxy'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'

import type { CustomFetch } from '@/v2/blocks/operation-block/helpers/send-request'

// RFC 8414 and OIDC share these consumed fields; this alias does not imply OIDC issuer semantics.
import {
  type OpenIDConnectDiscovery as AuthorizationServerMetadata,
  OpenIDConnectDiscoverySchema as AuthorizationServerMetadataSchema,
} from './fetch-openid-connect-discovery'

const isAllowedMetadataUrl = (url: URL): boolean =>
  url.protocol === 'https:' || (url.protocol === 'http:' && isLocalUrl(url.href))

/** Fetches the exact RFC8414 metadata URL, without applying OIDC issuer URL conventions. */
export const fetchOAuth2Metadata = async (
  url: string,
  proxyUrl: string,
  customFetch: CustomFetch = fetch,
): Promise<ErrorResponse<AuthorizationServerMetadata>> => {
  try {
    const metadataUrl = new URL(url.trim())
    if (!isAllowedMetadataUrl(metadataUrl)) {
      return [new Error('OAuth2 metadata URL must use HTTPS or HTTP for local development URLs'), null]
    }
    const response = await customFetch(redirectToProxy(proxyUrl, metadataUrl.href))
    if (!response.ok) {
      return [new Error(`Failed to fetch OAuth2 metadata: ${response.status} ${response.statusText}`), null]
    }
    const data = coerceValue(AuthorizationServerMetadataSchema, await response.json())
    if (!data.authorization_endpoint && !data.token_endpoint && !data.device_authorization_endpoint) {
      return [new Error('Invalid OAuth2 metadata: missing or invalid endpoints'), null]
    }
    for (const endpoint of [data.authorization_endpoint, data.token_endpoint, data.device_authorization_endpoint]) {
      if (endpoint && !isAllowedMetadataUrl(new URL(endpoint))) {
        return [new Error('OAuth2 metadata endpoints must use HTTPS or HTTP for local development URLs'), null]
      }
    }
    return [null, data]
  } catch (error) {
    return [error instanceof Error ? error : new Error('Failed to fetch OAuth2 metadata'), null]
  }
}
