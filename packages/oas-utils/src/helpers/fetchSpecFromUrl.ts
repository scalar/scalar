import { fetchWithProxyFallback } from './fetchWithProxyFallback'
import { formatJsonOrYamlString } from './parse'

// Doesn’t work
const OLD_PROXY_URL = 'https://api.scalar.com/request-proxy'
// Does work
const NEW_PROXY_URL = 'https://proxy.scalar.com'

/**
 * Fetches an OpenAPI/Swagger document from a given URL.
 *
 * @throws an error if the fetch fails
 */
export async function fetchSpecFromUrl(
  url: string,
  proxy?: string,
  beautify = true,
): Promise<string> {
  // This replaces the OLD_PROXY_URL with the NEW_PROXY_URL on the fly.
  if (proxy === OLD_PROXY_URL) {
    // eslint-disable-next-line no-param-reassign
    proxy = NEW_PROXY_URL
  }

  try {
    const response = await fetchWithProxyFallback(url, proxy)

    if (!response.ok) {
      throw new Error(
        `Failed to fetch the OpenAPI document: ${url} (Status: ${response.status})`,
      )
    }

    const text = await response.text()

    // If it's JSON, make it pretty
    return beautify ? formatJsonOrYamlString(text) : text
  } catch (error) {
    console.error(
      `[fetchSpecFromUrl] Failed to fetch the OpenAPI document at ${url}`,
      error,
    )

    if (!proxy) {
      console.warn(
        `[fetchSpecFromUrl] Tried to fetch the OpenAPI document (${url}) without a proxy. Are the CORS headers configured to allow cross-domain requests? https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS`,
      )
    }

    throw error
  }
}
