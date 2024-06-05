import { formatJsonOrYamlString } from './parse'

// Doesn’t work
const OLD_PROXY_URL = 'https://api.scalar.com/request-proxy'
// Does work
const NEW_PROXY_URL = 'https://proxy.scalar.com'

/** Redirects the request to a proxy server with a given URL. */
function redirectToProxy(proxy: string, url: string): string {
  return `${proxy}?scalar_url=${encodeURI(url)}`
}

/** Fetches an OpenAPI/Swagger specification from a given URL. */
export async function fetchSpecFromUrl(
  url: string,
  proxy?: string,
): Promise<string> {
  // This replaces the OLD_PROXY_URL with the NEW_PROXY_URL on the fly.
  if (proxy === OLD_PROXY_URL) {
    // eslint-disable-next-line no-param-reassign
    proxy = NEW_PROXY_URL
  }

  // To use a proxy or not to use a proxy
  const response = await fetch(proxy ? redirectToProxy(proxy, url) : url)

  // Looks like the request failed
  if (response.status !== 200) {
    console.error(
      `[fetchSpecFromUrl] Failed to fetch the specification at ${url} (Status: ${response.status})`,
    )

    if (!proxy) {
      console.warn(
        `[fetchSpecFromUrl] Tried to fetch the specification (url: ${url}) without a proxy. Are the CORS headers configured to allow cross-domain requests? https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS`,
      )
    }
  }

  // If it’s JSON, make it pretty
  return formatJsonOrYamlString(await response.text())
}
