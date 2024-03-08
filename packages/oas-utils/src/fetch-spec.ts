import { loadJsonOrYaml, loadJsonOrYamlString } from './parse'

/** Fetches an OAS spec file from a given URL. */
export const fetchSpecFromUrl = async (
  url: string,
  proxy?: string,
  parseObject = false,
) => {
  // Optional use of proxy for fetching
  const response = proxy
    ? await fetch(proxy, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'GET',
          url,
        }),
      })
    : await fetch(url)

  if (response.status !== 200) {
    const proxyWarning = proxy
      ? ''
      : 'Trying to fetch the spec file without a proxy. The CORS headers must be set properly or the request will fail.'
    console.error(
      `[fetchSpecFromUrl] Failed to fetch the spec at ${url}. ${proxyWarning}`,
    )
  }

  const payload = await response.text()

  // Formats the JSON if provided
  return parseObject ? loadJsonOrYamlString(payload) : loadJsonOrYaml(payload)
}
