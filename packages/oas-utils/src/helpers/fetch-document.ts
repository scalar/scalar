import { formatJsonOrYamlString } from './parse'
import { redirectToProxy } from './redirect-to-proxy'

// Doesn't work
const OLD_PROXY_URL = 'https://api.scalar.com/request-proxy'
// Does work
const NEW_PROXY_URL = 'https://proxy.scalar.com'

/**
 * Fetches an OpenAPI/Swagger document from a given URL
 *
 * @throws an error if the fetch fails
 */
export async function fetchDocument(
  url: string,
  proxyUrl?: string,
  fetcher?: (input: string | URL | globalThis.Request, init?: RequestInit) => Promise<Response>,
  prettyPrint = true,
): Promise<string> {
  // This replaces the OLD_PROXY_URL with the NEW_PROXY_URL on the fly.
  if (proxyUrl === OLD_PROXY_URL) {
    // biome-ignore lint/style/noParameterAssign: It's ok, let's make an exception here.
    proxyUrl = NEW_PROXY_URL
  }

  const response = await (fetcher ? fetcher(url, undefined) : fetch(redirectToProxy(proxyUrl, url)))

  // Looks like the request failed
  if (response.status !== 200) {
    console.error(`[fetchDocument] Failed to fetch the OpenAPI document from ${url} (Status: ${response.status})`)

    if (!proxyUrl) {
      console.warn(
        `[fetchDocument] Tried to fetch the OpenAPI document from ${url} without a proxy. Are the CORS headers configured to allow cross-domain requests? https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS`,
      )
    }

    throw new Error(`Failed to fetch the OpenAPI document from ${url} (Status: ${response.status})`)
  }

  // If it's JSON, make it pretty
  if (prettyPrint) {
    return formatJsonOrYamlString(await response.text())
  }

  return await response.text()
}
