/**
 * Fetches a spec file from a given URL.
 */
export const fetchSpecFromUrl = async (url: string, proxy?: string) => {
  // With Proxy
  if (proxy) {
    const response = await fetch(proxy, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'GET',
        url,
      }),
    })

    const payload = await response.json()

    if (payload.error) {
      throw new Error(JSON.stringify(payload))
    }

    return jsonOrYaml(JSON.stringify(payload))
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

function jsonOrYaml(value: string) {
  try {
    // JSON
    const data = JSON.parse(value)
    return JSON.stringify(data, null, 2)
  } catch {
    // Yaml
    return value
  }
}
