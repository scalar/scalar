function jsonOrYaml(value: string) {
  // If we don't start with a bracket assume yaml
  const trimmed = value.trim()
  if (trimmed[0] !== '{') return value

  try {
    // JSON
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    // Yaml
    return value
  }
}

/**
 * Fetches a spec file from a given URL.
 */
export const fetchSpecFromUrl = async (url: string, proxy?: string) => {
  // With Proxy
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
      : 'Trying to fetch the spec file without a proxy. The CORS headers have to be set properly, otherwise the request will fail.'
    console.error(
      `[fetchSpecFromUrl] Failed to fetch the spec at ${url}. ${proxyWarning}`,
    )
  }

  const payload = await response.text()

  // Formats the JSON if provided
  return jsonOrYaml(payload)
}
