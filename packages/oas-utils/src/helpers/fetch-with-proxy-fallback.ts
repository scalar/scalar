import { redirectToProxy, shouldUseProxy } from './redirect-to-proxy'

export type FetchWithProxyFallbackOptions = {
  proxyUrl: string | undefined
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/cache
   */
  cache?: RequestInit['cache']
}

/**
 * Fetches an OpenAPI document with a proxyUrl fallback mechanism.
 *
 * If a proxy is provided and the URL requires it, it will first attempt to fetch using the proxy.
 * If the proxy fetch fails or is not used, it will fall back to a direct fetch.
 */
export async function fetchWithProxyFallback(url: string, { proxyUrl, cache }: FetchWithProxyFallbackOptions) {
  const fetchOptions = {
    cache: cache || 'default',
  }
  const shouldTryProxy = shouldUseProxy(proxyUrl, url)
  const initialUrl = shouldTryProxy ? redirectToProxy(proxyUrl, url) : url

  try {
    const result = await fetch(initialUrl, fetchOptions)

    if (result.ok || !shouldTryProxy) {
      return result
    }

    // Retry without proxyUrl if the initial request failed
    return await fetch(url, fetchOptions)
  } catch (error) {
    if (shouldTryProxy) {
      // If proxyUrl failed, try without it
      return await fetch(url, fetchOptions)
    }
    throw error
  }
}
