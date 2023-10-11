export const fetchSpecFromUrl = async (
  url: string,
  { proxyUrl }: { proxyUrl?: string },
) => {
  // With Proxy
  if (proxyUrl) {
    const response = proxyUrl
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
      : await fetch(url)

    const payload = await response.json()

    if (payload.error) {
      throw new Error(JSON.stringify(payload))
    }

    if (!payload.data) {
      throw new Error(
        'Didn’t receive a proper answer from the Proxy: ' +
          JSON.stringify(payload),
      )
    }

    const data = JSON.parse(payload.data)

    return JSON.stringify(data, null, 2)
  }
  // Without proxy
  else {
    console.warn(
      '[fetchSpecFromUrl] Trying to fetch the spec file without a proxy. The CORS headers have to bet set properly, otherwise the request will fail.',
    )
    const response = await fetch(url)
    const json = await response.json()
    return JSON.stringify(json, null, 2)
  }
}
