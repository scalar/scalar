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
  if (proxy) {
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

    const payload = await response.json()

    if (payload.error) {
      throw new Error(JSON.stringify(payload))
    }

    if (!payload.data) {
      throw new Error(
        "Didn't receive a proper answer from the Proxy: " +
          JSON.stringify(payload),
      )
    }

    return jsonOrYaml(payload.data)
  }
  // Without proxy
  else {
    console.warn(
      '[fetchSpecFromUrl] Trying to fetch the spec file without a proxy. The CORS headers have to be set properly, otherwise the request will fail.',
    )
    const response = await fetch(url)

    return jsonOrYaml(await response.text())
  }
}
