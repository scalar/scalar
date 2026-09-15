import type { ErrorResponse } from '@scalar/helpers/errors/normalize-error'
import { redirectToProxy } from '@scalar/helpers/url/redirect-to-proxy'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'

import type { CustomFetch } from '@/v2/blocks/operation-block/helpers/send-request'

import { type OpenIDConnectDiscovery, OpenIDConnectDiscoverySchema } from './fetch-openid-connect-discovery'

// Reserved development domains are broader than loopback, so isLocalUrl is not suitable here.
const isAllowedMetadataUrl = (url: URL): boolean =>
  url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))

/** Fetches the exact RFC8414 metadata URL, without applying OIDC issuer URL conventions. */
export const fetchOAuth2Metadata = async (
  url: string,
  proxyUrl: string,
  customFetch: CustomFetch = fetch,
): Promise<ErrorResponse<OpenIDConnectDiscovery>> => {
  try {
    const metadataUrl = new URL(url.trim())
    if (!isAllowedMetadataUrl(metadataUrl)) {
      return [new Error('OAuth2 metadata URL must use HTTPS or HTTP on loopback'), null]
    }
    const response = await customFetch(redirectToProxy(proxyUrl, metadataUrl.href))
    if (!response.ok) {
      return [new Error(`Failed to fetch OAuth2 metadata: ${response.status} ${response.statusText}`), null]
    }
    const data = coerceValue(OpenIDConnectDiscoverySchema, await response.json())
    if (!data.authorization_endpoint && !data.token_endpoint) {
      return [new Error('Invalid OAuth2 metadata: missing or invalid endpoints'), null]
    }
    for (const endpoint of [data.authorization_endpoint, data.token_endpoint]) {
      if (endpoint && !isAllowedMetadataUrl(new URL(endpoint))) {
        return [new Error('OAuth2 metadata endpoints must use HTTPS or HTTP on loopback'), null]
      }
    }
    return [null, data]
  } catch (error) {
    return [error instanceof Error ? error : new Error('Failed to fetch OAuth2 metadata'), null]
  }
}
