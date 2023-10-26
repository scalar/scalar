import { mapFromArray } from '@scalar/api-client'
import { AxiosHeaders } from 'axios'
import type { HarRequest } from 'httpsnippet-lite'

import { mapFromObject } from '../helpers'
import type { Cookie, HarRequestWithPath, Header, Query } from '../types'

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

  // We’re working with { name: …, value … }, Axios is working with { name: value }. We need to transform the data with mapFromArray and mapFromObject.
  mergedRequests.headers = mapFromObject(
    AxiosHeaders.from(
      mapFromArray(mergedRequests.headers as Header[], 'name', 'value'),
    ).normalize(true),
    'name',
  ) as {
    name: string
    value: string
  }[]

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
