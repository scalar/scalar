import { redirectToProxy, shouldUseProxy } from './redirectToProxy'

export type FetchWithProxyFallbackOptions = {
  proxy: string | undefined
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/cache
   */
  cache?: RequestInit['cache']
}

/**
 * Fetches an OpenAPI document with a proxy fallback mechanism.
 *
 * If a proxy is provided and the URL requires it, it will first attempt to fetch using the proxy.
 * If the proxy fetch fails or is not used, it will fall back to a direct fetch.
 */
export async function fetchWithProxyFallback(url: string, { proxy, cache }: FetchWithProxyFallbackOptions) {
  const fetchOptions = {
    cache: cache || 'default',
  }
  const shouldTryProxy = shouldUseProxy(proxy, url)
  const initialUrl = shouldTryProxy ? redirectToProxy(proxy, url) : url

  try {
    const result = await fetch(initialUrl, fetchOptions)

    if (result.ok || !shouldTryProxy) {
      return result
    }

    // Retry without proxy if the initial request failed
    return await fetch(url, fetchOptions)
  } catch (error) {
    if (shouldTryProxy) {
      // If proxy failed, try without it
      return await fetch(url, fetchOptions)
    }
    throw error
  }
}
