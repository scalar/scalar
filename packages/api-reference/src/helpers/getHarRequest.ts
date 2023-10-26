import { mapFromArray } from '@scalar/api-client'
import { AxiosHeaders } from 'axios'
import type { HarRequest } from 'httpsnippet-lite'

import { mapFromObject } from '../helpers'
import type { Cookie, HarRequestWithPath, Header, Query } from '../types'

export const getHarRequest = (
  ...requests: Partial<HarRequestWithPath>[]
): HarRequest => {
  let newHarRequest: HarRequestWithPath = {
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
    newHarRequest = {
      ...newHarRequest,
      ...request,
      headers: [...newHarRequest.headers, ...(request.headers ?? [])],
      queryString: [
        ...newHarRequest.queryString,
        ...(request.queryString ?? []),
      ],
      cookies: [...newHarRequest.cookies, ...(request.cookies ?? [])],
    }
  })

  // We’re working with { name: …, value … }, Axios is working with { name: value }. We need to transform the data with mapFromArray and mapFromObject.
  newHarRequest.headers = mapFromObject(
    AxiosHeaders.from(
      mapFromArray(newHarRequest.headers as Header[], 'name', 'value'),
    ).normalize(true),
    'name',
  ) as {
    name: string
    value: string
  }[]

  // Path doesn’t exist in HAR, let’s concat the path and the URL
  const { path, ...result } = newHarRequest

  if (path) {
    return {
      ...result,
      url: `${newHarRequest.url}${path}`,
    }
  }

  return result
}
