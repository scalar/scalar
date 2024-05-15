import { formatJsonOrYamlString } from './parse'

/** Redirects the request to a proxy server with a given URL. */
function redirectToProxy(proxy: string, url: string): string {
  return `${proxy}?scalar_url=${encodeURI(url)}`
}

/** Fetches an OpenAPI/Swagger specification from a given URL. */
export async function fetchSpecFromUrl(
  url: string,
  proxy?: string,
): Promise<string> {
  // Optional use of proxy for fetching
  const response = await fetch(proxy ? redirectToProxy(proxy, url) : url)

  if (response.status !== 200) {
    console.error(
      `[fetchSpecFromUrl] Failed to fetch the specification at ${url}. ${proxyWarning}`,
    )

    if (!proxy) {
      console.warn(
        `[fetchSpecFromUrl] Tried to fetch the specification (url: ${url}) without a proxy. Are the CORS headers configured to allow cross-domain requests? https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS`,
      )
    }
  }

  const payload = proxy ? String(await response.text()) : await response.text()

  // Formats the JSON if provided
  return formatJsonOrYamlString(payload)
}
