import { normalizeHeaders } from '@scalar/api-client/libs'
import type {
  Cookie,
  HarRequestWithPath,
  Header,
  Query,
} from '@scalar/types/legacy'
import type { HarRequest } from 'httpsnippet-lite'

export const getHarRequest = (
  ...requests: Partial<HarRequestWithPath>[]
): HarRequest => {
  let mergedRequests: HarRequestWithPath = {
    httpVersion: '1.1',
    method: 'GET',
    url: '',
    path: '',
    headers: [] as Header[],
    headersSize: -1,
    queryString: [] as Query[],
    cookies: [] as Cookie[],
    bodySize: -1,
  }

  // Merge all the requests
  requests.forEach((request: Partial<HarRequestWithPath>) => {
    mergedRequests = {
      ...mergedRequests,
      ...request,
      headers: [...mergedRequests.headers, ...(request.headers ?? [])],
      queryString: [
        ...mergedRequests.queryString,
        ...(request.queryString ?? []),
      ],
      cookies: [...mergedRequests.cookies, ...(request.cookies ?? [])],
    }
  })

  // Normalize HTTP headers
  mergedRequests.headers = normalizeHeaders(mergedRequests.headers) as Header[]

  // Path doesn’t exist in HAR, let’s concat the path and the URL
  const { path, ...result } = mergedRequests

  if (path) {
    return {
      ...result,
      url: `${mergedRequests.url}${path}`,
    }
  }

  return result
}
