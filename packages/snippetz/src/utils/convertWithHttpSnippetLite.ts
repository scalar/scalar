import type { Request } from '@/httpsnippet-lite/types/httpsnippet'
import type { HarRequest } from '@scalar/types/snippetz'

/**
 * Takes a httpsnippet-lite client and converts the given request to a code example with it.
 *
 * @deprecated This a temporary wrapper around httpsnippet-lite. Let's write all the generators ourselves instead.
 */
export function convertWithHttpSnippetLite(
  // Couldn't find the proper type, there was always a mismatch.
  client: Record<string, unknown>,
  request?: Partial<HarRequest>,
): string {
  const urlObject = new URL(request?.url ?? '')

  // If it's just the domain, omit the trailing slash
  const url = urlObject.pathname === '/' ? urlObject.origin : urlObject.toString()

  const harRequest: HarRequest = {
    method: request?.method ?? 'GET',
    url,
    httpVersion: 'HTTP/1.1',
    cookies: [], // Cookies are handled through headers
    headers: request?.headers ?? [],
    headersSize: -1,
    bodySize: -1,
    queryString: Array.from(urlObject.searchParams.entries()).map(([name, value]) => ({
      name,
      value,
    })),
    postData: request?.postData,
  }

  const allHeaders = (harRequest?.headers ?? []).reduce(
    (acc, header) => ({
      ...acc,
      [header.name]: header.value,
    }),
    {} as Record<string, string>,
  )

  const queryObj = (harRequest.queryString ?? []).reduce(
    (acc, param) => ({
      ...acc,
      [param.name]: param.value,
    }),
    {} as Record<string, string>,
  )

  const cookiesObj = (harRequest.cookies ?? []).reduce(
    (acc, cookie) => ({
      ...acc,
      [cookie.name]: cookie.value,
    }),
    {} as Record<string, string>,
  )

  const parsedUrl = new URL(harRequest.url)
  const uriObj = {
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    host: parsedUrl.hostname,
    port: parsedUrl.port,
    pathname:
      parsedUrl.pathname
        .split('/')
        .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
        .join('/') + parsedUrl.search,
    path:
      parsedUrl.pathname
        .split('/')
        .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
        .join('/') + parsedUrl.search,
    search: parsedUrl.search,
    hash: parsedUrl.hash,
    href: parsedUrl.href,
    origin: parsedUrl.origin,
    password: parsedUrl.password,
    searchParams: parsedUrl.searchParams,
    username: parsedUrl.username,
    toString: parsedUrl.toString,
    toJSON: () => parsedUrl.toJSON(),
  }

  const convertRequest = {
    url: harRequest.url,
    uriObj,
    method: harRequest.method?.toLocaleUpperCase() ?? 'GET',
    httpVersion: harRequest.httpVersion,
    cookies: harRequest.cookies ?? [],
    headers: harRequest.headers ?? [],
    headersSize: harRequest.headersSize ?? 0,
    headersObj: allHeaders ?? {},
    bodySize: harRequest.bodySize ?? 0,
    queryString: harRequest.queryString ?? [],
    postData: harRequest.postData
      ? {
          mimeType: harRequest.postData.mimeType ?? 'application/json',
          text: harRequest.postData.text ?? '',
          params: harRequest.postData.params ?? [],
          paramsObj:
            harRequest.postData.params?.reduce(
              (acc, param) => {
                if (param.name && param.value !== undefined) {
                  acc[param.name] = param.value
                }
                return acc
              },
              {} as Record<string, string>,
            ) ?? {},
        }
      : undefined,
    allHeaders: allHeaders ?? {},
    fullUrl: harRequest.url,
    queryObj: queryObj ?? {},
    cookiesObj: cookiesObj ?? {},
  } as Request

  // If the request is a JSON request, parse the text as JSON
  if (convertRequest.postData?.mimeType === 'application/json' && convertRequest.postData?.text) {
    try {
      convertRequest.postData.jsonObj = JSON.parse(convertRequest.postData.text)
    } catch (error) {
      console.error('Error parsing JSON:', error)
    }
  }

  if (typeof client.convert === 'function') {
    return client.convert(convertRequest)
  }

  return ''
}
