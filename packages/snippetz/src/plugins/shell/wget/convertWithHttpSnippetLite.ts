import type { Request } from 'har-format'
import type { HarRequest } from 'httpsnippet-lite'
import type { Client } from '~httpsnippet-lite/dist/types/targets/targets'

/**
 * Takes a httpsnippet-lite and converts the given request to a code example with it.
 */
export function convertWithHttpSnippetLite(
  client: Client<object>,
  partialRequest?: Partial<Request>,
) {
  const request = {
    url: partialRequest?.url ?? '',
    httpVersion: partialRequest?.httpVersion ?? 'HTTP/1.1',
    cookies: partialRequest?.cookies ?? [],
    headers: partialRequest?.headers ?? [],
    headersSize: partialRequest?.headersSize ?? 0,
    bodySize: partialRequest?.bodySize ?? 0,
    queryString: partialRequest ?? [],
    ...partialRequest,
  }

  const allHeaders = (request?.headers ?? []).reduce(
    (acc, header) => ({
      ...acc,
      [header.name]: header.value,
    }),
    {} as Record<string, string>,
  )

  return client?.convert({
    url: request.url,
    method: request.method?.toLocaleUpperCase() ?? 'GET',
    httpVersion: request.httpVersion,
    cookies: request.cookies,
    headers: request.headers,
    headersSize: request.headersSize,
    bodySize: request.bodySize,
    // @ts-expect-error Might be fine.
    queryString: request.queryString,
    postData: ((request ?? {}) as HarRequest)?.postData,
    allHeaders,
    fullUrl: request.url,
  })
}
