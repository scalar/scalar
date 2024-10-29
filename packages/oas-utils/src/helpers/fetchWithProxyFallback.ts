import { redirectToProxy, shouldUseProxy } from './redirectToProxy'

export type FetchWithProxyFallbackOptions = {
  proxy?: string
  /**
   * The browser looks for a matching request in its HTTP cache. If there is a match, fresh or stale, the browser will
   * make a conditional request to the remote server:
   *
   * - If the server indicates that the resource has not changed, it will be returned from the cache.
   *   Otherwise the resource will be downloaded from the server and the cache will be updated.
   * - If there is no match, the browser will make a normal request, and will update the cache
   *   with the downloaded resource.
   */
  noCache?: boolean
}

/**
 * Fetches an OpenAPI document with a proxy fallback mechanism.
 *
 * If a proxy is provided and the URL requires it, it will first attempt to fetch using the proxy.
 * If the proxy fetch fails or is not used, it will fall back to a direct fetch.
 *
 * Also handles cases where the input is a JSON object instead of a URL.
 */
export async function fetchWithProxyFallback(
  url: string,
  { proxy, noCache }: FetchWithProxyFallbackOptions,
) {
  const fetchOptions = noCache === true ? ({ cache: 'no-cache' } as const) : {}
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
