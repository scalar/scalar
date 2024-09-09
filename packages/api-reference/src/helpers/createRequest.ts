import type { Request } from '@scalar/snippetz'

/**
 * Creates a complete HAR request, even if just passed a partial request.
 */
export function createRequest(partialRequest?: Partial<Request>): Request {
  return {
    httpVersion: 'http/2.0',
    method: 'GET',
    url: '',
    cookies: [],
    headers: [],
    headersSize: 0,
    bodySize: 0,
    queryString: [],
    ...(partialRequest ?? {}),
  }
}
