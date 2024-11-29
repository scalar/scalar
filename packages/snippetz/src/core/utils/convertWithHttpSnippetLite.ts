import type { Request } from 'har-format'
import type { HarRequest } from 'httpsnippet-lite'
import type { Client } from '~httpsnippet-lite/dist/types/targets/targets'

/**
 * Takes a httpsnippet-lite client and converts the given request to a code example with it.
 */
export function convertWithHttpSnippetLite(
  client: Client<object>,
  partialRequest?: Partial<Request>,
): string {
  const request = {
    url: partialRequest?.url ?? '',
    httpVersion: partialRequest?.httpVersion ?? 'HTTP/1.1',
    cookies: partialRequest?.cookies ?? [],
    headers: partialRequest?.headers ?? [],
    headersSize: partialRequest?.headersSize ?? 0,
    bodySize: partialRequest?.bodySize ?? 0,
    queryString: partialRequest?.queryString ?? [],
    ...partialRequest,
  }

  const allHeaders = (request?.headers ?? []).reduce(
    (acc, header) => ({
      ...acc,
      [header.name]: header.value,
    }),
    {} as Record<string, string>,
  )

  const queryObj = (request.queryString ?? []).reduce(
    (acc, param) => ({
      ...acc,
      [param.name]: param.value,
    }),
    {} as Record<string, string>,
  )

  const cookiesObj = (request.cookies ?? []).reduce(
    (acc, cookie) => ({
      ...acc,
      [cookie.name]: cookie.value,
    }),
    {} as Record<string, string>,
  )

  const parsedUrl = new URL(request.url)
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
    url: request.url,
    uriObj,
    method: request.method?.toLocaleUpperCase() ?? 'GET',
    httpVersion: request.httpVersion,
    cookies: request.cookies,
    headers: request.headers,
    headersSize: request.headersSize,
    headersObj: allHeaders,
    bodySize: request.bodySize,
    queryString: request.queryString,
    postData: ((request ?? {}) as HarRequest)?.postData,
    allHeaders,
    fullUrl: request.url,
    queryObj,
    cookiesObj,
  })
}
