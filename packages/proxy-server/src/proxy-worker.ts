export default {
  async fetch(request: Request) {
    // Invalid request object
    if (
      !request.url ||
      typeof request.url !== 'string' ||
      request.url.length < 3
    )
      return new Response('Invalid request object provided', { status: 400 })

    // request.url could be path only so we just split instead of using URLSearchParams
    let [, parsedURL] = request.url.split(/\?url=/s)

    // No valid URL provided
    if (!parsedURL)
      return new Response('No valid url query param provided', { status: 400 })

    // Prepend the request scheme if its missing
    if (!parsedURL.startsWith('http')) parsedURL = 'https://' + parsedURL

    // Build the request URL
    const requestURL = new URL(parsedURL)

    // Send ittttt
    const modifiedRequest = new Request(requestURL, request)
    return fetch(modifiedRequest)
  },
}
