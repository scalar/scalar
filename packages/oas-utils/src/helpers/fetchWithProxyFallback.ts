import { resolve } from '@scalar/import'

import { redirectToProxy, shouldUseProxy } from './redirectToProxy'

/**
 * Fetches an OpenAPI document with a proxy fallback mechanism.
 *
 * If a proxy is provided and the URL requires it, it will first attempt to fetch using the proxy.
 * If the proxy fetch fails or is not used, it will fall back to a direct fetch.
 *
 * Also handles cases where the input is a JSON object instead of a URL.
 */
export async function fetchWithProxyFallback(value: string, proxy?: string) {
  // Maybe it’s not an OpenAPI document URL, but we can still find the actual URL
  const url = await resolve(value)

  // If the value is an object, mock a fetch response with beautified JSON
  if (typeof value === 'object' && value !== null) {
    const json = JSON.stringify(value, null, 2)

    return {
      ok: true,
      status: 200,
      text: async () => json,
    } as Response
  }

  if (typeof url !== 'string') {
    throw new Error(`[fetchWithProxyFallback] Can’t fetch URL: ${url}`)
  }

  const shouldTryProxy = shouldUseProxy(proxy, url)
  const initialUrl = shouldTryProxy ? redirectToProxy(proxy, url) : url

  try {
    const result = await fetch(initialUrl, { cache: 'no-cache' })

    if (result.ok || !shouldTryProxy) {
      return result
    }

    // Retry without proxy if the initial request failed
    return await fetch(url, { cache: 'no-cache' })
  } catch (error) {
    if (shouldTryProxy) {
      // If proxy failed, try without it
      return await fetch(url, { cache: 'no-cache' })
    }
    throw error
  }
}
