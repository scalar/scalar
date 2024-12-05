import type { Client } from '@/httpsnippet-lite/dist/types/targets/targets'
import type { Request as HarRequest } from 'har-format'

/**
 * Takes a httpsnippet-lite client and converts the given request to a code example with it.
 */
export function convertWithHttpSnippetLite(
  client: Client<object>,
  request?: Partial<Request>,
): string {
  const url = new URL(request?.url ?? '')
  const harRequest: HarRequest = {
    method: request?.method ?? 'GET',
    url: url.toString(),
    httpVersion: 'HTTP/1.1',
    cookies: [], // Cookies are handled through headers
    headers: request?.headers
      ? Array.from(request.headers.entries()).map(([name, value]) => ({
          name,
          value,
        }))
      : [],
    headersSize: -1,
    bodySize: -1,
    queryString: Array.from(url.searchParams.entries()).map(
      ([name, value]) => ({
        name,
        value,
      }),
    ),
    // Request body can be accessed via request.body, bodyUsed, and the various body methods
    postData: request?.body
      ? {
          mimeType: request.headers?.get('content-type') ?? 'application/json',
          text: request.body.toString(),
        }
      : undefined,
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

  return client?.convert({
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
          text: harRequest.postData.text,
          params: harRequest.postData.params ?? [],
          jsonObj: harRequest.postData.mimeType?.includes('json')
            ? JSON.parse(harRequest.postData.text ?? '{}')
            : undefined,
          paramsObj:
            harRequest.postData.params?.reduce(
              (acc: Record<string, string>, param) => ({
                ...acc,
                [param.name]: param.value ?? '',
              }),
              {} as Record<string, string>,
            ) ?? {},
        }
      : undefined,
    allHeaders: allHeaders ?? {},
    fullUrl: harRequest.url,
    queryObj: queryObj ?? {},
    cookiesObj: cookiesObj ?? {},
  })
}
