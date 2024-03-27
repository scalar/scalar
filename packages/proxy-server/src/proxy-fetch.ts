export const proxyFetch = async (request: Request) => {
  // Options
  // https://developers.cloudflare.com/workers/examples/cors-header-proxy/
  if (request.method === 'OPTIONS') {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,POST,PUT,DELETE,OPTIONS,PATCH',
      'Access-Control-Max-Age': '86400',
    }
    if (
      request.headers.get('Origin') !== null &&
      request.headers.get('Access-Control-Request-Method') !== null &&
      request.headers.get('Access-Control-Request-Headers') !== null
    ) {
      // Handle CORS preflight requests.
      return new Response(null, {
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Headers':
            request.headers.get('Access-Control-Request-Headers') ?? '',
        },
      })
    } else {
      // Handle standard OPTIONS request.
      return new Response(null, {
        headers: {
          Allow: 'GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH',
        },
      })
    }
  }

  // Invalid request object
  if (!request.url || typeof request.url !== 'string' || request.url.length < 3)
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

  // Send request
  const modifiedRequest = new Request(requestURL, request)
  modifiedRequest.headers.set('Origin', requestURL.origin)
  const originalResponse = await fetch(modifiedRequest)

  // Modify headers on return
  const response = new Response(originalResponse.body, originalResponse)
  response.headers.set(
    'Access-Control-Allow-Origin',
    request.headers.get('origin') || '*',
  )
  response.headers.append('Vary', 'Origin')

  return response
}
