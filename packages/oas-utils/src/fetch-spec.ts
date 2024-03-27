import { formatJsonOrYamlString } from './parse'

/** Fetches an OAS spec file from a given URL. */
export async function fetchSpecFromUrl(
  url: string,
  proxyUrl?: string,
): Promise<string> {
  const isOldProxy = proxyUrl === 'https://api.scalar.com/request-proxy'

  // Optional use of proxy for fetching
  const response = isOldProxy
    ? await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'GET',
          url,
        }),
      })
    : await fetch(proxyUrl ? `${proxyUrl}?url=${url}` : url)

  if (response.status !== 200) {
    const proxyWarning = proxyUrl
      ? ''
      : 'Trying to fetch the spec file without a proxy. The CORS headers must be set properly or the request will fail.'
    console.error(
      `[fetchSpecFromUrl] Failed to fetch the spec at ${url}. ${proxyWarning}`,
    )
  }

  const payload = isOldProxy
    ? String((await response.json()).data)
    : await response.text()

  // Formats the JSON if provided
  return formatJsonOrYamlString(payload)
}
