export default {
  async fetch(request: Request) {
    const proxyURL = new URL(request.url)
    let urlParam = proxyURL.searchParams.get('url')

    // No valid URL provided
    if (!urlParam)
      return new Response('No valid url query param provided', { status: 400 })

    // Prepend the request scheme if its missing
    if (!urlParam.includes('http'))
      urlParam = proxyURL.protocol + '//' + urlParam

    // Build the request URL
    const requestURL = new URL(urlParam)

    // Send ittttt
    const modifiedRequest = new Request(requestURL, request)
    return fetch(modifiedRequest)
  },
}
