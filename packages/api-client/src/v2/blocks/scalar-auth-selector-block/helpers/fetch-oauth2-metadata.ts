import type { ErrorResponse } from '@scalar/helpers/errors/normalize-error'
import { redirectToProxy } from '@scalar/helpers/url/redirect-to-proxy'
import { Value } from '@scalar/typebox/value'

import type { CustomFetch } from '@/v2/blocks/operation-block/helpers/send-request'

import { type OpenIDConnectDiscovery, OpenIDConnectDiscoverySchema } from './fetch-openid-connect-discovery'

/** Fetches the exact RFC8414 metadata URL, without applying OIDC issuer URL conventions. */
export const fetchOAuth2Metadata = async (
  url: string,
  proxyUrl: string,
  customFetch: CustomFetch = fetch,
): Promise<ErrorResponse<OpenIDConnectDiscovery>> => {
  try {
    const metadataUrl = new URL(url.trim())
    if (metadataUrl.protocol !== 'https:') {
      return [new Error('OAuth2 metadata URL must use HTTPS'), null]
    }
    const response = await customFetch(redirectToProxy(proxyUrl, metadataUrl.href))
    if (!response.ok) {
      return [new Error(`Failed to fetch OAuth2 metadata: ${response.status} ${response.statusText}`), null]
    }
    const data: unknown = await response.json()
    if (!Value.Check(OpenIDConnectDiscoverySchema, data) || (!data.authorization_endpoint && !data.token_endpoint)) {
      return [new Error('Invalid OAuth2 metadata: missing or invalid endpoints'), null]
    }
    for (const endpoint of [data.authorization_endpoint, data.token_endpoint]) {
      if (endpoint && new URL(endpoint).protocol !== 'https:') {
        return [new Error('OAuth2 metadata endpoints must use HTTPS'), null]
      }
    }
    return [null, data]
  } catch (error) {
    return [error instanceof Error ? error : new Error('Failed to fetch OAuth2 metadata'), null]
  }
}
