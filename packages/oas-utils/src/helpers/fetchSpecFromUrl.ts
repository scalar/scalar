import { redirectToProxy } from '@/helpers/redirectToProxy'

import { formatJsonOrYamlString } from './parse'

// Doesn’t work
const OLD_PROXY_URL = 'https://api.scalar.com/request-proxy'
// Does work
const NEW_PROXY_URL = 'https://proxy.scalar.com'

/**
 * Fetches an OpenAPI/Swagger specification from a given URL.
 *
 * @throws an error if the fetch fails
 */
export async function fetchSpecFromUrl(url: string, proxy?: string, beautify = true): Promise<string> {
  // This replaces the OLD_PROXY_URL with the NEW_PROXY_URL on the fly.
  if (proxy === OLD_PROXY_URL) {
    // biome-ignore lint/style/noParameterAssign: It’s ok, let’s make an exception here.
    proxy = NEW_PROXY_URL
  }

  // To use a proxy or not to use a proxy
  const response = await fetch(proxy ? redirectToProxy(proxy, url) : url)

  // Looks like the request failed
  if (response.status !== 200) {
    console.error(`[fetchSpecFromUrl] Failed to fetch the specification at ${url} (Status: ${response.status})`)

    if (!proxy) {
      console.warn(
        `[fetchSpecFromUrl] Tried to fetch the specification (url: ${url}) without a proxy. Are the CORS headers configured to allow cross-domain requests? https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS`,
      )
    }

    throw new Error(`Failed to fetch the specification (Status: ${response.status})`)
  }

  // If it’s JSON, make it pretty
  if (beautify) {
    return formatJsonOrYamlString(await response.text())
  }
  return await response.text()
}
